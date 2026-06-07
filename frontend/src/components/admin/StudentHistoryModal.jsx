import { useState, useEffect } from 'react';
import { getStudentMonths, getStudentAttendance } from '../../api/attendance';
import Spinner from '../ui/Spinner';
import Badge from '../ui/Badge';
import { motion } from 'framer-motion';
import { Calendar, User, FileText, CheckCircle2, XCircle, Clock, MapPin, X } from 'lucide-react';

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
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

export default function StudentHistoryModal({ student, onClose }) {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getStudentMonths(student._id);
        const list = res.months || [];
        setMonths(list);
        if (list.length > 0) setSelectedMonth(list[0]);
      } catch { setMonths([]); }
      finally { setLoadingMonths(false); }
    })();
  }, [student._id]);

  useEffect(() => {
    if (!selectedMonth) return;
    setLoadingData(true);
    getStudentAttendance(student._id, selectedMonth)
      .then((data) => setMonthData(data))
      .catch(() => setMonthData(null))
      .finally(() => setLoadingData(false));
  }, [student._id, selectedMonth]);

  const cells = monthData ? buildCalendar(selectedMonth, monthData.records) : [];
  const presentDates = monthData?.records.filter(r => r.present).map(r => r.date) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="relative w-full max-w-lg my-6 bg-white rounded-[28px] shadow-2xl overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-100">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-sm ${getColor(student.name)}`}>
            {initials(student.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">{student.name}</h2>
              <Badge variant={student.active ? 'present' : 'absent'}>
                {student.active ? 'Active' : 'Passed Out'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {student.rollNo} · <MapPin className="w-3.5 h-3.5" /> Room {student.roomNo || 'Unassigned'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-smooth cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        {loadingMonths ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Spinner size="md" color="indigo" />
            <p className="text-xs font-semibold">Syncing calendar sheets...</p>
          </div>
        ) : months.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400 font-bold">No active roll-call sheets registered</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Month select sliding bar */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Month Timeline</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {months.map((m) => (
                  <button 
                    key={m} 
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-smooth cursor-pointer ${
                      m === selectedMonth
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {fmtMonth(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Month sheets representation */}
            {selectedMonth && (
              loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="sm" color="indigo" />
                </div>
              ) : monthData && (
                <div className="space-y-6">
                  {/* Summary bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/20">
                    <div className="text-center py-1">
                      <p className="text-xs font-bold text-slate-800">{monthData.totalDays}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Total Days</p>
                    </div>
                    <div className="text-center py-1 border-x border-slate-200/60">
                      <p className="text-xs font-bold text-emerald-600">{monthData.presentDays}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Present</p>
                    </div>
                    <div className="text-center py-1">
                      <p className="text-xs font-bold text-red-500">{monthData.absentDays}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Absent</p>
                    </div>
                  </div>

                  {/* Attendance percentage indicator bar */}
                  {monthData.totalDays > 0 && (() => {
                    const pct = Math.round((monthData.presentDays / monthData.totalDays) * 100);
                    const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500';
                    const textColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
                    return (
                      <div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-0.5">
                          <span className="text-slate-400">Ratio Metric</span>
                          <span className={`${textColor}`}>{pct}% Match</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/10">
                          <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Days grid sheet */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Calendar Sheet · {fmtMonth(selectedMonth)}
                    </h4>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {DAYS.map((d) => (
                        <div key={d} className="text-[10px] font-bold text-slate-400 pb-1.5 uppercase">{d}</div>
                      ))}
                      {cells.map((cell, i) =>
                        cell === null ? (
                          <div key={`empty-${i}`} className="aspect-square" />
                        ) : (
                          <div 
                            key={cell.iso}
                            className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-smooth ${
                              cell.status === true
                                ? 'bg-emerald-100/90 text-emerald-700 border border-emerald-200'
                                : cell.status === false
                                  ? 'bg-red-100/90 text-red-600 border border-red-200'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200/20'
                            }`}
                          >
                            {cell.day}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Registry dates tags */}
                  {presentDates.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Present Check-Ins</h4>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-slate-200/25">
                        {presentDates.map((d) => (
                          <span 
                            key={d} 
                            className="bg-emerald-50/70 text-emerald-700 border border-emerald-100 rounded-xl px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
