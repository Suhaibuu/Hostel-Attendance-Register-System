import { useState, useEffect } from 'react';
import { getStudentMonths, getStudentAttendance } from '../../api/attendance';
import Spinner from '../ui/Spinner';
import Badge from '../ui/Badge';

// ── Calendar helpers ──────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const buildCalendar = (yearMonth, records) => {
  const [y, m] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDow = new Date(y, m - 1, 1).getDay(); // 0=Sun

  // lookup: "YYYY-MM-DD" → true | false
  const lookup = {};
  records.forEach((r) => { lookup[r.date] = r.present; });

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null); // empty prefix
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${yearMonth}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, iso, status: lookup[iso] ?? null }); // null = no record
  }
  return cells;
};

const fmtMonth = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
const getColor = (n) => avatarColors[(n || 'A').charCodeAt(0) % avatarColors.length];
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ── Component ──────────────────────────────────────────────

export default function StudentHistoryModal({ student, onClose }) {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Load list of months with records
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

  // Load attendance for selected month
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-lg my-6 bg-white rounded-2xl shadow-2xl overflow-hidden"
           onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-100">
          <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${getColor(student.name)}`}>
            {initials(student.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800">{student.name}</h2>
              <Badge variant={student.active ? 'present' : 'absent'}>
                {student.active ? 'Active' : 'Passed Out'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{student.rollNo} · Room {student.roomNo} · {student.department}</p>
          </div>
          <button onClick={onClose}
                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer shrink-0">
            ✕
          </button>
        </div>

        {/* ── Month selector ── */}
        {loadingMonths ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
            <Spinner size="sm" /> Loading history...
          </div>
        ) : months.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-2">📭</span>
            <p className="text-sm text-slate-400">No attendance records yet</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Month pills */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Select Month</p>
              <div className="flex flex-wrap gap-2">
                {months.map((m) => (
                  <button key={m} onClick={() => setSelectedMonth(m)}
                          className={[
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer',
                            m === selectedMonth
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          ].join(' ')}>
                    {fmtMonth(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Month detail */}
            {selectedMonth && (
              loadingData ? (
                <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
                  <Spinner size="sm" /> Loading...
                </div>
              ) : monthData && (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['🗓️', 'Total Days', monthData.totalDays],
                      ['✅', 'Present', monthData.presentDays],
                      ['❌', 'Absent', monthData.absentDays],
                    ].map(([icon, label, val]) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <span className="text-lg block">{icon}</span>
                        <p className="text-xl font-bold text-slate-800">{val}</p>
                        <p className="text-xs text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Attendance % bar */}
                  {monthData.totalDays > 0 && (() => {
                    const pct = Math.round((monthData.presentDays / monthData.totalDays) * 100);
                    const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500';
                    const textColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
                    return (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Attendance</span>
                          <span className={`font-bold ${textColor}`}>{pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Calendar grid */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      {fmtMonth(selectedMonth)} — Day View
                    </p>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {DAYS.map((d) => (
                        <div key={d} className="text-[10px] font-semibold text-slate-400 pb-1">{d}</div>
                      ))}
                      {cells.map((cell, i) =>
                        cell === null ? (
                          <div key={`e-${i}`} />
                        ) : (
                          <div key={cell.iso}
                               title={cell.status === true ? `${cell.iso} — Present` : cell.status === false ? `${cell.iso} — Absent` : `${cell.iso} — No record`}
                               className={[
                                 'aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all',
                                 cell.status === true
                                   ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                   : cell.status === false
                                     ? 'bg-red-100 text-red-600 border border-red-200'
                                     : 'bg-slate-100 text-slate-400',
                               ].join(' ')}>
                            {cell.day}
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-slate-500 justify-center">
                      <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300 inline-block" /> Present</span>
                      <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-100 border border-red-200 inline-block" /> Absent</span>
                      <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-100 inline-block" /> No record</span>
                    </div>
                  </div>

                  {/* Present dates list */}
                  {presentDates.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Present Dates</p>
                      <div className="flex flex-wrap gap-1.5">
                        {presentDates.map((d) => (
                          <span key={d} className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-0.5 text-xs font-medium">
                            {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
