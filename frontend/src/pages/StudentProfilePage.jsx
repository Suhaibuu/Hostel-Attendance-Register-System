import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentMonths, getStudentAttendance } from '../api/attendance';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

// ── Calendar helpers ──────────────────────────────────────

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

const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
const getColor = (n) => avatarColors[(n || 'A').charCodeAt(0) % avatarColors.length];
const getInitials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ── Component ─────────────────────────────────────────────

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
  const pctColor = 'bg-blue-500';
  const pctText  = 'text-blue-600';

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Top bar */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-800">My Profile</h1>
          <p className="text-xs text-slate-500">HostelTrack · GEC Wayanad</p>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* ── Student info card ── */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 flex items-center gap-4">
          <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 ${getColor(user?.name)}`}>
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.rollNo} · {user?.department || 'N/A'}</p>
            {user?.roomNo ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2 py-0.5 font-medium">
                  🛏️ Room {user.roomNo}
                </span>
              </div>
            ) : (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2 py-0.5 font-medium inline-block mt-1">
                ⏳ Room not yet allotted
              </span>
            )}
          </div>
        </div>

        {/* ── Attendance section ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Attendance History</h3>

          {loadingMonths ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm bg-white rounded-2xl border border-[var(--color-border)]">
              <Spinner size="sm" /> Loading...
            </div>
          ) : months.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-[var(--color-border)]">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-sm text-slate-400">No attendance records yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 space-y-5">
              {/* Month pills */}
              <div className="flex flex-wrap gap-2">
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer',
                      m === selectedMonth
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    {fmtMonth(m)}
                  </button>
                ))}
              </div>

              {selectedMonth && (
                loadingData ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
                    <Spinner size="sm" /> Loading...
                  </div>
                ) : monthData && (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ['🗓️', 'Total', monthData.totalDays],
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
                    {monthData.totalDays > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Attendance</span>
                          <span className={`font-bold ${pctText}`}>{pct}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pctColor} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Calendar grid */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        {fmtMonth(selectedMonth)}
                      </p>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {DAYS.map((d) => (
                          <div key={d} className="text-[10px] font-semibold text-slate-400 pb-1">{d}</div>
                        ))}
                        {cells.map((cell, i) =>
                          cell === null ? (
                            <div key={`e-${i}`} />
                          ) : (
                            <div
                              key={cell.iso}
                              className={[
                                'aspect-square rounded-lg flex items-center justify-center text-xs font-medium',
                                cell.status === true
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                  : cell.status === false
                                    ? 'bg-red-100 text-red-600 border border-red-200'
                                    : 'bg-slate-100 text-slate-400',
                              ].join(' ')}
                            >
                              {cell.day}
                            </div>
                          )
                        )}
                      </div>
                      <div className="flex gap-4 mt-3 text-xs text-slate-500 justify-center">
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300 inline-block" /> Present
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded bg-red-100 border border-red-200 inline-block" /> Absent
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded bg-slate-100 inline-block" /> No record
                        </span>
                      </div>
                    </div>

                    {/* Present dates */}
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
    </div>
  );
}
