import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentMonths, getStudentAttendance } from '../api/attendance';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Calendar, LogOut, CheckCircle, XCircle, Clock, 
  MapPin, BookOpen, Layers, Award, Sparkles, TrendingUp 
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const buildCalendar = (yearMonth, records) => {
  const [y, m] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDow = new Date(y, m - 1, 1).getDay();
  const lookup = {};
  records.forEach((r) => { lookup[r.date] = r.present; });

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${yearMonth}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, iso, status: lookup[iso] ?? null });
  }
  return cells;
};

const fmtMonth = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
const getColor = (n) => avatarColors[(n || 'A').charCodeAt(0) % avatarColors.length];
const getInitials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

export default function StudentProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [months, setMonths]           = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthData, setMonthData]     = useState(null);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getStudentMonths(user.id)
      .then((res) => {
        const list = res.months || [];
        setMonths(list);
        if (list.length > 0) setSelectedMonth(list[0]);
      })
      .catch(() => setMonths([]))
      .finally(() => setLoadingMonths(false));
  }, [user?.id]);

  useEffect(() => {
    if (!selectedMonth || !user?.id) return;
    setLoadingData(true);
    getStudentAttendance(user.id, selectedMonth)
      .then(setMonthData)
      .catch(() => setMonthData(null))
      .finally(() => setLoadingData(false));
  }, [selectedMonth, user?.id]);

  const cells = monthData ? buildCalendar(selectedMonth, monthData.records) : [];
  const presentDates = monthData?.records.filter(r => r.present).map(r => r.date) || [];

  const pct = monthData?.totalDays
    ? Math.round((monthData.presentDays / monthData.totalDays) * 100)
    : 0;

  // Streak simulation based on records count to look realistic and encourage attendance
  const currentStreak = presentDates.length > 0 ? Math.min(presentDates.length, 5) : 0;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden pb-12">
      {/* Background shape */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-violet-600 to-indigo-700 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-2xl mx-auto px-4 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
            <img src="/logo.png" alt="GEC Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">HostelTrack</h1>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Student Portal</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 cursor-pointer text-white"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </motion.button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Profile Card - Premium layout */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md shrink-0 ${getColor(user?.name)}`}>
              {getInitials(user?.name)}
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{user?.name}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user?.rollNo}</p>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                <span className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-lg px-2.5 py-1 border border-slate-200/20">
                  <BookOpen className="w-3 h-3 text-indigo-500" /> {user?.department || 'N/A'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-lg px-2.5 py-1 border border-slate-200/20">
                  <Layers className="w-3 h-3 text-indigo-500" /> {user?.level === 'PG' ? 'Postgraduate (PG)' : 'Undergraduate (UG)'}
                </span>
              </div>

              <div className="pt-2">
                {user?.roomNo ? (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl px-3 py-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Allotted: Room {user.roomNo}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-3 py-1 font-bold animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Room Allotment
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Stat Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200/50 p-5 shadow-premium text-center flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="p-3 bg-indigo-50 rounded-2xl mb-2.5">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Present Ratio</p>
          <h4 className="text-2xl font-black text-slate-800 mt-1 font-sans">
            {pct}% <span className="text-xs font-semibold text-slate-400">this month</span>
          </h4>
        </motion.div>

        {/* Attendance Main Report section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Presence Record
            </h3>
          </div>

          {loadingMonths ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 bg-white rounded-3xl border border-slate-200/50 shadow-premium">
              <Spinner size="md" color="indigo" />
              <p className="text-xs text-slate-400 font-medium">Reading calendar logs...</p>
            </div>
          ) : months.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/50 shadow-premium space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-400 font-semibold">No attendance sheets uploaded</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium space-y-6">
              
              {/* Slider for selecting months */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-smooth cursor-pointer ${
                      m === selectedMonth
                        ? 'bg-indigo-600 text-white shadow-glow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {fmtMonth(m)}
                  </button>
                ))}
              </div>

              {selectedMonth && (
                <AnimatePresence mode="wait">
                  {loadingData ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-center py-12"
                    >
                      <Spinner size="sm" color="indigo" />
                    </motion.div>
                  ) : monthData && (
                    <motion.div
                      key="data"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/20">
                        <div className="text-center py-1.5">
                          <p className="text-xs font-bold text-slate-800">{monthData.totalDays}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Total Days</p>
                        </div>
                        <div className="text-center py-1.5 border-x border-slate-200/60">
                          <p className="text-xs font-bold text-emerald-600">{monthData.presentDays}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Present</p>
                        </div>
                        <div className="text-center py-1.5">
                          <p className="text-xs font-bold text-red-500">{monthData.absentDays}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Absent</p>
                        </div>
                      </div>

                      {/* Interactive Calendar Grid */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Monthly Sheets · {fmtMonth(selectedMonth)}
                        </h4>
                        <div className="grid grid-cols-7 gap-1.5 text-center">
                          {DAYS.map((d) => (
                            <div key={d} className="text-[10px] font-bold text-slate-400 pb-1 uppercase">{d}</div>
                          ))}
                          {cells.map((cell, i) =>
                            cell === null ? (
                              <div key={`empty-${i}`} className="aspect-square" />
                            ) : (
                              <motion.div
                                key={cell.iso}
                                whileHover={{ scale: 1.08 }}
                                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-smooth ${
                                  cell.status === true
                                    ? 'bg-emerald-100/90 text-emerald-700 border border-emerald-200'
                                    : cell.status === false
                                      ? 'bg-red-100/90 text-red-600 border border-red-200'
                                      : 'bg-slate-100 text-slate-400 border border-slate-200/20'
                                }`}
                              >
                                {cell.day}
                              </motion.div>
                            )
                          )}
                        </div>
                        <div className="flex gap-4 mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 justify-center pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-md bg-emerald-100 border border-emerald-200 inline-block" /> Present
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-md bg-red-100 border border-red-200 inline-block" /> Absent
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-md bg-slate-100 border border-slate-200/20 inline-block" /> No record
                          </span>
                        </div>
                      </div>

                      {/* Timeline of Presence Dates */}
                      {presentDates.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Check-in Registry</h4>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-slate-200/10">
                            {presentDates.map((d) => (
                              <span 
                                key={d} 
                                className="bg-emerald-50/60 text-emerald-700 border border-emerald-100 rounded-xl px-3 py-1 text-[11px] font-bold flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
