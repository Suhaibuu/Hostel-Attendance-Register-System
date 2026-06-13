import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRooms, createStudent } from '../api/students';
import { getTodayAttendance, markAttendance, getTodayStats } from '../api/attendance';
import PageWrapper from '../components/layout/PageWrapper';
import TopBar from '../components/layout/TopBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import StudentHistoryModal from '../components/admin/StudentHistoryModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Home, CheckCircle2, XCircle, Plus, Search, Calendar, 
  MapPin, LogOut, ArrowRight, ShieldCheck, HelpCircle, History 
} from 'lucide-react';

const formatDate = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });

const todayISO = () => new Date().toISOString().slice(0, 10);

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
const getAvatarColor = (name) => avatarColors[(name || 'A').charCodeAt(0) % avatarColors.length];
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function AddStudentModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    rollNo: '',
    roomNo: '',
    department: 'Computer Science (CSE)',
    level: 'UG',
    category: 'General',
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

  const inp = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all font-semibold text-slate-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-6 border border-slate-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Plus className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Add New Resident</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} placeholder="Aditya Nair" required />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Roll Number / College ID</label>
            <input type="text" value={form.rollNo} onChange={(e) => set('rollNo', e.target.value.toUpperCase())} className={`${inp} uppercase`} placeholder="CST221" required />
            {errors.rollNo && <p className="text-xs text-red-500 mt-1">{errors.rollNo}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Room No (Optional)</label>
              <input type="text" value={form.roomNo} onChange={(e) => set('roomNo', e.target.value)} className={inp} placeholder="101" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Program Level</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)} className={inp}>
                <option value="UG">UG (B.Tech)</option>
                <option value="PG">PG (M.Tech)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Department</label>
            <select value={form.department} onChange={(e) => set('department', e.target.value)} className={inp}>
              <option value="Computer Science (CSE)">Computer Science (CSE)</option>
              <option value="Electronics and Communication(ECE)">Electronics (ECE)</option>
              <option value="Mechanical(ME)">Mechanical (ME)</option>
              <option value="Electrical and Electronics(EEE)">Electrical (EEE)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inp}>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OEC">OEC</option>
            </select>
          </div>

          {errors._form && <p className="text-sm text-red-500 text-center">{errors._form}</p>}
          
          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-smooth cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-smooth cursor-pointer shadow-glow flex items-center justify-center gap-1"
            >
              {saving ? <Spinner size="sm" color="white" /> : 'Register Student'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

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
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0, unmarked: 0, roomHighlight: {} });

  const fetchStats = useCallback(async () => {
    try {
      const data = await getTodayStats();
      setTodayStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, []);

  // Fetch rooms and stats
  useEffect(() => {
    getRooms()
      .then((d) => setRooms(d.rooms || []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
    fetchStats();
  }, [fetchStats]);

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
      await fetchStats();
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
    await fetchStats();
    // Reload current room if same room
    if (selectedRoom === form.roomNo) await loadRoom(form.roomNo);
  };

  const roomDot = (roomNo) => {
    const status = todayStats.roomHighlight[roomNo];
    if (status === 'fully') return 'bg-emerald-500';
    if (status === 'partially') return 'bg-amber-500';
    return 'bg-slate-300';
  };

  return (
    <PageWrapper>
      <TopBar
        title="Hostel Attendance Warden"
        subtitle={formatDate()}
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
        
        {/* Daily Stats Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Present Today', val: todayStats.present, color: 'bg-emerald-50 text-emerald-700 border-emerald-100/60' },
            { label: 'Absent Today', val: todayStats.absent, color: 'bg-red-50 text-red-700 border-red-100/60' },
            { label: 'Unmarked Today', val: todayStats.unmarked, color: 'bg-amber-50 text-amber-700 border-amber-100/60' },
          ].map((stat) => (
            <motion.div 
              key={stat.label}
              whileHover={{ y: -2 }}
              className="p-5 rounded-3xl border border-slate-200/50 shadow-premium bg-white flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-3xl font-black text-slate-800 mt-1.5 font-sans leading-none">{stat.val}</h4>
              </div>
              <div className={`p-3 rounded-2xl ${stat.color} border`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section 1: Room Selection Operations */}
        <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-slate-400" />
                Select Room Block
              </h2>
              <p className="text-xs text-slate-500 mt-1">Select a room to execute the daily roll-call report</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 cursor-pointer shadow-glow self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Resident
            </button>
          </div>

          {roomsLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-6 justify-center">
              <Spinner size="sm" color="indigo" /> Syncing rooms...
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No active room partitions allotted</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {rooms.map((r) => {
                const isSelected = r === selectedRoom;
                return (
                  <motion.button
                    key={r}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => loadRoom(r)}
                    className={`relative rounded-2xl border py-3.5 font-extrabold text-sm transition-smooth cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600 shadow-glow'
                        : todayStats.roomHighlight[r] === 'fully'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100/40'
                        : todayStats.roomHighlight[r] === 'partially'
                        ? 'bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-100/40'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{r}</span>
                    <span className={`absolute top-2 right-2 h-2 w-2 rounded-full ${roomDot(r)}`} />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Student List Marking Panel */}
        {selectedRoom && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {studentsLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-16">
                <Spinner size="md" color="indigo" />
                <p className="text-xs text-slate-400 font-medium">Syncing resident list...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/50 p-12 shadow-premium text-center">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-bold">No active students in Room {selectedRoom}</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800">Room {selectedRoom}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
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

                {/* Asymmetric lists - organic card styling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                  {students.map((s, idx) => {
                    const status = marks[s.studentId];
                    const isEven = idx % 2 === 0;

                    return (
                      <motion.div 
                        key={s.studentId}
                        whileHover={{ y: -2 }}
                        className={`flex items-center gap-4 p-4 border transition-smooth ${
                          isEven ? 'organic-card-1' : 'organic-card-2'
                        } ${
                          status === true  
                            ? 'bg-emerald-50/70 border-emerald-300/60 shadow-sm' 
                            : status === false 
                            ? 'bg-red-50/70 border-red-300/60 shadow-sm' 
                            : 'bg-slate-50/50 border-slate-200/80 hover:border-slate-300/80'
                        }`}
                      >
                        {/* Avatar initials representation */}
                        <div className={`shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-sm ${getAvatarColor(s.name)}`}>
                          {getInitials(s.name)}
                        </div>

                        {/* Student meta representation */}
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            className="text-left font-bold text-slate-800 text-sm truncate hover:text-primary-600 transition-colors cursor-pointer flex items-center gap-1 w-full"
                            onClick={() => setHistoryStudent({ _id: s.studentId, name: s.name, rollNo: s.rollNo, roomNo: selectedRoom, active: true, department: '' })}
                          >
                            <span>{s.name}</span>
                            <History className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 inline shrink-0" />
                          </button>
                          <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">{s.rollNo}</p>
                        </div>

                        {/* Interactive Toggle Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleMark(s.studentId, true)}
                            className={`p-2.5 rounded-xl border transition-smooth cursor-pointer ${
                              status === true
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleMark(s.studentId, false)}
                            className={`p-2.5 rounded-xl border transition-smooth cursor-pointer ${
                              status === false
                                ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                          </motion.button>
                        </div>

                      </motion.div>
                    );
                  })}
                </div>

              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Sticky Submit bar - Premium Floating Panel */}
      {selectedRoom && students.length > 0 && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl bg-slate-900/95 backdrop-blur text-white rounded-3xl border border-slate-800 shadow-[0_15px_40px_rgba(0,0,0,0.3)] flex items-center justify-between px-6 py-4"
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Marking State</span>
            <span className="text-sm font-bold text-white mt-0.5">{markedCount} of {students.length} Resolved</span>
          </div>
          <button 
            disabled={markedCount === 0 || submitting}
            onClick={handleSubmit}
            className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-smooth cursor-pointer shadow-glow disabled:shadow-none"
          >
            {submitting ? <Spinner size="sm" color="white" /> : <>Complete Sync <ArrowRight className="w-4 h-4" /></>}
          </button>
        </motion.div>
      )}

      {/* Modals & Dialog overlays */}
      <AnimatePresence>
        {showAddModal && <AddStudentModal onSave={handleAddStudent} onClose={() => setShowAddModal(false)} />}
        {historyStudent && <StudentHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)} />}
      </AnimatePresence>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PageWrapper>
  );
}
