import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRooms, createStudent } from '../api/students';
import { getTodayAttendance, markAttendance } from '../api/attendance';
import PageWrapper from '../components/layout/PageWrapper';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import StudentHistoryModal from '../components/admin/StudentHistoryModal';

// ── Helpers ──────────────────────────────────────────────

const formatDate = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });

const todayISO = () => new Date().toISOString().slice(0, 10);

const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
const getAvatarColor = (name) => avatarColors[(name || 'A').charCodeAt(0) % avatarColors.length];
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Add Student Modal (warden-accessible) ───────────────

function AddStudentModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    rollNo: '',
    roomNo: '',
    department: 'Computer Science (CSE)',
    level: 'UG',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.rollNo.trim()) e.rollNo = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setErrors({ _form: err.message || 'Failed to add student' });
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Add New Student</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} required />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Roll No</label>
            <input type="text" value={form.rollNo} onChange={(e) => set('rollNo', e.target.value.toUpperCase())} className={`${inp} uppercase`} required />
            {errors.rollNo && <p className="text-xs text-red-500 mt-1">{errors.rollNo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Room No (Optional)</label>
            <input type="text" value={form.roomNo} onChange={(e) => set('roomNo', e.target.value)} className={inp} />
            {errors.roomNo && <p className="text-xs text-red-500 mt-1">{errors.roomNo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <select value={form.department} onChange={(e) => set('department', e.target.value)} className={inp}>
              <option value="Computer Science (CSE)">Computer Science (CSE)</option>
              <option value="Electronics and Communication(ECE)">Electronics and Communication(ECE)</option>
              <option value="Mechanical(ME)">Mechanical(ME)</option>
              <option value="Electrical and Electronics(EEE)">Electrical and Electronics(EEE)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Program Level</label>
            <select value={form.level} onChange={(e) => set('level', e.target.value)} className={inp}>
              <option value="UG">Undergraduate (UG)</option>
              <option value="PG">Postgraduate (PG)</option>
            </select>
          </div>

          {errors._form && <p className="text-sm text-red-500 text-center">{errors._form}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} fullWidth type="button">Cancel</Button>
            <Button variant="primary" fullWidth type="submit" loading={saving}>Add Student</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────

export default function WardenPage() {
  const { user, logout } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});       // studentId → true | false | null
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submittedRooms, setSubmittedRooms] = useState(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null); // student obj

  // Fetch rooms
  useEffect(() => {
    getRooms()
      .then((d) => setRooms(d.rooms || []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, []);

  // Fetch attendance when room changes
  const loadRoom = useCallback(async (roomNo) => {
    setSelectedRoom(roomNo);
    setStudentsLoading(true);
    try {
      const data = await getTodayAttendance(roomNo);
      setStudents(data.students || []);
      const initial = {};
      (data.students || []).forEach((s) => { initial[s.studentId] = s.present; });
      setMarks(initial);
      if ((data.students || []).length > 0 && (data.students || []).every((s) => s.present !== null)) {
        setSubmittedRooms((prev) => new Set(prev).add(roomNo));
      }
    } catch {
      setStudents([]);
      setMarks({});
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  // ── Toggle: clicking same button again → deselect (null) ──
  const toggleMark = (studentId, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === value ? null : value,
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    students.forEach((s) => { updated[s.studentId] = true; });
    setMarks(updated);
  };

  const markedCount = Object.values(marks).filter((v) => v !== null).length;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = Object.entries(marks)
        .filter(([, v]) => v !== null)
        .map(([studentId, present]) => ({ studentId, present }));
      await markAttendance({ roomNo: selectedRoom, date: todayISO(), records });
      setSubmittedRooms((prev) => new Set(prev).add(selectedRoom));
      setToast({ message: `✓ Attendance saved for Room ${selectedRoom}`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to submit attendance', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStudent = async (form) => {
    await createStudent(form);
    setShowAddModal(false);
    setToast({ message: `✓ Student added successfully`, type: 'success' });
    // Refresh rooms list
    const d = await getRooms();
    setRooms(d.rooms || []);
    // Reload current room if same room
    if (selectedRoom === form.roomNo) await loadRoom(form.roomNo);
  };

  const roomDot = (roomNo) => {
    if (submittedRooms.has(roomNo)) return 'bg-emerald-400';
    if (roomNo === selectedRoom) return 'bg-amber-400';
    return 'bg-slate-300';
  };

  return (
    <PageWrapper>
      <TopBar
        title="HostelTrack"
        subtitle={formatDate()}
        rightContent={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </div>
        }
      />

      <main className="flex-1 px-4 py-5 pb-28 space-y-5">
        {/* ── Section 1: Room Selector + Add Student ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-slate-600">Select Room</h2>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              + Add Student
            </Button>
          </div>

          {roomsLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-6 justify-center">
              <Spinner size="sm" /> Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No rooms found</p>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {rooms.map((r) => (
                <button
                  key={r}
                  onClick={() => loadRoom(r)}
                  className={[
                    'relative rounded-xl border py-3 font-bold text-sm transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none',
                    r === selectedRoom
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300',
                  ].join(' ')}
                >
                  {r}
                  <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${roomDot(r)}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2: Student List ── */}
        {selectedRoom && (
          <div>
            {studentsLoading ? (
              <div className="flex items-center justify-center gap-2 text-slate-400 py-12">
                <Spinner size="md" /> Loading students...
              </div>
            ) : students.length === 0 ? (
              <Card>
                <p className="text-sm text-slate-400 text-center">No active students in Room {selectedRoom}</p>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">Room {selectedRoom}</h3>
                    <Badge variant="info">{students.length} students</Badge>
                  </div>
                  <Button variant="success" size="sm" onClick={markAllPresent}>✓ All Present</Button>
                </div>

                <div className="space-y-2.5">
                  {students.map((s) => {
                    const status = marks[s.studentId];
                    const rowBg =
                      status === true  ? 'bg-emerald-50/60 border-emerald-200' :
                      status === false ? 'bg-red-50/60 border-red-200' :
                                         'bg-white border-slate-200';

                    return (
                      <div key={s.studentId}
                           className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${rowBg}`}>
                        {/* Avatar */}
                        <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getAvatarColor(s.name)}`}>
                          {getInitials(s.name)}
                        </div>

                        {/* Info — clickable to open history */}
                        <button
                          className="flex-1 min-w-0 text-left cursor-pointer"
                          onClick={() => setHistoryStudent({ _id: s.studentId, name: s.name, rollNo: s.rollNo, roomNo: selectedRoom, active: true, department: '' })}
                        >
                          <p className="text-sm font-semibold text-slate-800 truncate hover:text-[var(--color-primary)] transition-colors">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-500">{s.rollNo} · Tap for history</p>
                        </button>

                        {/* Present / Absent pills */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleMark(s.studentId, true)}
                            className={[
                              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none',
                              status === true
                                ? 'bg-[var(--color-success)] text-white'
                                : 'bg-transparent border border-emerald-300 text-emerald-600',
                            ].join(' ')}
                          >✓</button>
                          <button
                            onClick={() => toggleMark(s.studentId, false)}
                            className={[
                              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none',
                              status === false
                                ? 'bg-[var(--color-danger)] text-white'
                                : 'bg-transparent border border-red-300 text-red-500',
                            ].join(' ')}
                          >✗</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Sticky Submit Bar ── */}
      {selectedRoom && students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[var(--color-border)] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between px-4 py-3">
          <span className="text-sm text-slate-500">{markedCount} of {students.length} marked</span>
          <Button variant="primary" size="md" onClick={handleSubmit} disabled={markedCount === 0} loading={submitting}>
            Submit Attendance
          </Button>
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal && <AddStudentModal onSave={handleAddStudent} onClose={() => setShowAddModal(false)} />}
      {historyStudent && <StudentHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PageWrapper>
  );
}
