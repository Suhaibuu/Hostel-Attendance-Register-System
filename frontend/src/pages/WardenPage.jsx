import { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRooms, createStudent } from '../api/students';
import { getRoomAttendance, markAttendance, getTodayStats } from '../api/attendance';
import PageWrapper from '../components/layout/PageWrapper';
import TopBar from '../components/layout/TopBar';
import Spinner from '../components/ui/Spinner';
import Toast from '../components/ui/Toast';
import StudentHistoryModal from '../components/admin/StudentHistoryModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Home, CheckCircle2, XCircle, Plus, Calendar,
  LogOut, ArrowRight, ShieldCheck, History, ChevronLeft, ChevronRight,
  AlertTriangle,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10);
const formatDisplayDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
const formatBarDate = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
const getAvatarColor = (name) => avatarColors[(name || 'A').charCodeAt(0) % avatarColors.length];
const getInitials = (name) => {
  if (!name) return '??';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ─── Date Picker (inline) ──────────────────────────────
function DateSelector({ value, onChange }) {
  const today = todayISO();
  const [open, setOpen] = useState(false);

  // Generate last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });

  const isToday = value === today;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
          isToday
            ? 'bg-primary-50 border-primary-200 text-primary-700'
            : 'bg-amber-50 border-amber-300 text-amber-700'
        }`}
      >
        <Calendar className="w-3.5 h-3.5" />
        {isToday ? 'Today' : formatDisplayDate(value)}
        {!isToday && <span className="ml-1 bg-amber-200 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide">Past</span>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-56"
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">Select Date</p>
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {days.map(d => (
                  <button
                    key={d}
                    onClick={() => { onChange(d); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      d === value
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{d === today ? '📅 Today' : formatDisplayDate(d)}</span>
                    {d === value && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Add Student Modal ─────────────────────────────────
function AddStudentModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', rollNo: '', roomNo: '',
    department: 'Computer Science (CSE)', level: 'UG', category: 'General',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!form.name.trim()) e2.name = 'Required';
    if (!form.rollNo.trim()) e2.rollNo = 'Required';
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (err) { setErrors({ _form: err.message || 'Failed' }); }
    finally { setSaving(false); }
  };

  const inp = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all font-semibold text-slate-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-6 border border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-50 rounded-xl"><Plus className="w-5 h-5 text-indigo-600" /></div>
          <h2 className="text-lg font-bold text-slate-800">Add New Resident</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Full Name</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="Aditya Nair" required />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Roll Number</label>
            <input type="text" value={form.rollNo} onChange={e => set('rollNo', e.target.value.toUpperCase())} className={`${inp} uppercase`} placeholder="CST221" required />
            {errors.rollNo && <p className="text-xs text-red-500 mt-1">{errors.rollNo}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Room No</label>
              <input type="text" value={form.roomNo} onChange={e => set('roomNo', e.target.value)} className={inp} placeholder="101" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Program</label>
              <select value={form.level} onChange={e => set('level', e.target.value)} className={inp}>
                <option value="UG">UG (B.Tech)</option>
                <option value="PG">PG (M.Tech)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Department</label>
            <select value={form.department} onChange={e => set('department', e.target.value)} className={inp}>
              <option value="Computer Science (CSE)">Computer Science (CSE)</option>
              <option value="Electronics and Communication(ECE)">Electronics (ECE)</option>
              <option value="Mechanical(ME)">Mechanical (ME)</option>
              <option value="Electrical and Electronics(EEE)">Electrical (EEE)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inp}>
              <option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>OEC</option>
            </select>
          </div>
          {errors._form && <p className="text-sm text-red-500 text-center">{errors._form}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-smooth cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-smooth cursor-pointer shadow-glow flex items-center justify-center gap-1">
              {saving ? <Spinner size="sm" color="white" /> : 'Register Student'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Student Card (memoized for perf) ─────────────────
const StudentCard = memo(function StudentCard({ s, status, onToggle, onHistory, selectedRoom }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -1 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        status === true  ? 'bg-emerald-50/80 border-emerald-300/60' :
        status === false ? 'bg-red-50/80 border-red-300/60' :
        'bg-slate-50/50 border-slate-200/80 hover:border-slate-300/80'
      }`}
    >
      <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-black ${getAvatarColor(s.name)}`}>
        {getInitials(s.name)}
      </div>
      <div className="flex-1 min-w-0">
        <button
          type="button"
          className="text-left font-bold text-slate-800 text-sm hover:text-primary-600 transition-colors cursor-pointer flex items-center gap-1 w-full"
          onClick={() => onHistory({ _id: s.studentId, name: s.name, rollNo: s.rollNo, roomNo: selectedRoom, active: true, department: '' })}
        >
          <span className="truncate">{s.name}</span>
          <History className="w-3 h-3 text-slate-400 shrink-0" />
        </button>
        <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">{s.rollNo}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onToggle(s.studentId, true)}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${status === true ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggle(s.studentId, false)}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${status === false ? 'bg-red-500 text-white border-red-500' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
});

// ─── Main Page ─────────────────────────────────────────
export default function WardenPage() {
  const { user, logout } = useAuth();

  const [rooms, setRooms]               = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const [students, setStudents]             = useState([]);
  const [marks, setMarks]                   = useState({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [toast, setToast]                   = useState(null);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [todayStats, setTodayStats]         = useState({ present: 0, absent: 0, unmarked: 0, roomHighlight: {} });

  const fetchStats = useCallback(async () => {
    try { setTodayStats(await getTodayStats()); } catch {}
  }, []);

  useEffect(() => {
    Promise.all([
      getRooms().then(d => setRooms(d.rooms || [])).catch(() => setRooms([])),
      fetchStats(),
    ]).finally(() => setRoomsLoading(false));
  }, [fetchStats]);

  const loadRoom = useCallback(async (roomNo, date) => {
    setSelectedRoom(roomNo);
    setStudentsLoading(true);
    try {
      const data = await getRoomAttendance(roomNo, date);
      const sts = data.students || [];
      setStudents(sts);
      const initial = {};
      sts.forEach(s => { initial[s.studentId] = s.present; });
      setMarks(initial);
    } catch {
      setStudents([]); setMarks({});
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  // Reload when date changes (if room already selected)
  useEffect(() => {
    if (selectedRoom) loadRoom(selectedRoom, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const toggleMark = useCallback((studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: prev[studentId] === value ? null : value }));
  }, []);

  const markAllPresent = useCallback(() => {
    const updated = {};
    students.forEach(s => { updated[s.studentId] = true; });
    setMarks(updated);
  }, [students]);

  const markedCount = Object.values(marks).filter(v => v !== null).length;
  const isToday = selectedDate === todayISO();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = Object.entries(marks)
        .filter(([, v]) => v !== null)
        .map(([studentId, present]) => ({ studentId, present }));
      await markAttendance({ roomNo: selectedRoom, date: selectedDate, records });
      setToast({ message: `✓ Attendance saved for Room ${selectedRoom} · ${formatDisplayDate(selectedDate)}`, type: 'success' });
      if (isToday) await fetchStats();
    } catch {
      setToast({ message: 'Failed to submit attendance', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStudent = async (form) => {
    await createStudent(form);
    setShowAddModal(false);
    setToast({ message: '✓ Student added successfully', type: 'success' });
    const d = await getRooms();
    setRooms(d.rooms || []);
    await fetchStats();
    if (selectedRoom === form.roomNo) await loadRoom(form.roomNo, selectedDate);
  };

  const roomDot = (r) => {
    if (!isToday) return 'bg-slate-300';
    const s = todayStats.roomHighlight[r];
    if (s === 'fully') return 'bg-emerald-500';
    if (s === 'partially') return 'bg-amber-500';
    return 'bg-slate-300';
  };

  return (
    <PageWrapper>
      <TopBar
        title="Hostel Attendance Warden"
        subtitle={formatBarDate()}
        rightContent={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{user?.name || 'Warden'}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hostel Warden</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-500 transition-smooth flex items-center gap-1.5 text-xs font-bold border border-slate-200/40 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        }
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* Stats (today only) */}
        {isToday && (
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {[
              { label: 'Present', val: todayStats.present, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              { label: 'Absent',  val: todayStats.absent,  color: 'bg-red-50 text-red-700 border-red-100' },
              { label: 'Unmarked',val: todayStats.unmarked, color: 'bg-amber-50 text-amber-700 border-amber-100' },
            ].map(stat => (
              <div key={stat.label} className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border ${stat.color} flex items-center justify-between`}>
                <div>
                  <p className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest opacity-70">{stat.label}</p>
                  <h4 className="text-2xl md:text-3xl font-black mt-1 leading-none">{stat.val}</h4>
                </div>
                <CheckCircle2 className="w-5 h-5 opacity-40" />
              </div>
            ))}
          </div>
        )}

        {/* Room Selection */}
        <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Home className="w-4 h-4" /> Select Room
              </h2>
              <p className="text-xs text-slate-500 mt-1">Pick a room and date to mark attendance</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <DateSelector value={selectedDate} onChange={setSelectedDate} />
              <button
                onClick={() => setShowAddModal(true)}
                className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Resident
              </button>
            </div>
          </div>

          {/* Past date banner */}
          {!isToday && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-semibold">
                Marking attendance for <span className="font-black">{formatDisplayDate(selectedDate)}</span> — past date
              </p>
            </div>
          )}

          {roomsLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-6 justify-center">
              <Spinner size="sm" color="indigo" /> Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No active rooms</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {rooms.map(r => {
                const isSelected = r === selectedRoom;
                const hl = isToday ? todayStats.roomHighlight[r] : null;
                return (
                  <motion.button
                    key={r}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => loadRoom(r, selectedDate)}
                    className={`relative rounded-2xl border py-3.5 font-extrabold text-sm transition-smooth cursor-pointer flex flex-col items-center justify-center ${
                      isSelected ? 'bg-primary-600 text-white border-primary-600 shadow-glow' :
                      hl === 'fully' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      hl === 'partially' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{r}</span>
                    <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${roomDot(r)}`} />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Student List */}
        {selectedRoom && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {studentsLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-16">
                <Spinner size="md" color="indigo" />
                <p className="text-xs font-medium">Loading residents...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/50 p-12 text-center shadow-premium">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-bold">No active students in Room {selectedRoom}</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800">Room {selectedRoom}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase">
                      {students.length} Residents
                    </span>
                  </div>
                  <button
                    onClick={markAllPresent}
                    className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" /> All Present
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {students.map(s => (
                    <StudentCard
                      key={s.studentId}
                      s={s}
                      status={marks[s.studentId]}
                      onToggle={toggleMark}
                      onHistory={setHistoryStudent}
                      selectedRoom={selectedRoom}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Floating submit bar */}
      {selectedRoom && students.length > 0 && (
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl bg-slate-900/95 backdrop-blur text-white rounded-3xl border border-slate-800 shadow-[0_15px_40px_rgba(0,0,0,0.3)] flex items-center justify-between px-6 py-4"
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              {isToday ? 'Today' : formatDisplayDate(selectedDate)}
            </span>
            <span className="text-sm font-bold mt-0.5">{markedCount} of {students.length} Marked</span>
          </div>
          <button
            disabled={markedCount === 0 || submitting}
            onClick={handleSubmit}
            className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-smooth cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? <Spinner size="sm" color="white" /> : <>Save Attendance <ArrowRight className="w-4 h-4" /></>}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showAddModal && <AddStudentModal onSave={handleAddStudent} onClose={() => setShowAddModal(false)} />}
        {historyStudent && <StudentHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)} />}
      </AnimatePresence>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PageWrapper>
  );
}
