import { useState } from 'react';
import { getReport } from '../../api/attendance';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function AttendanceTab() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState('roomNo');
  const [sortDir, setSortDir] = useState(1);

  const load = async () => {
    setLoading(true);
    try { setData(await getReport(month)); }
    catch { setData([]); }
    finally { setLoading(false); }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d * -1);
    else { setSortKey(key); setSortDir(1); }
  };

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'number') return (av - bv) * sortDir;
    return String(av).localeCompare(String(bv)) * sortDir;
  });

  const totalPresent = data.reduce((s, r) => s + r.presentDays, 0);
  const totalPossible = data.reduce((s, r) => s + r.totalDays, 0);
  const avgPct = totalPossible ? Math.round((totalPresent / totalPossible) * 100) : 0;
  const atRisk = data.filter((r) => r.totalDays && (r.presentDays / r.totalDays) * 100 < 75).length;

  const pct = (r) => r.totalDays ? Math.round((r.presentDays / r.totalDays) * 100) : 0;
  const pctColor = (p) => p >= 75 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-400' : 'bg-red-500';
  const pctText = (p) => p >= 75 ? 'text-emerald-600' : p >= 50 ? 'text-amber-600' : 'text-red-600';

  const SortHeader = ({ k, children }) => (
    <th className="pb-3 cursor-pointer select-none hover:text-slate-700 transition-colors"
        onClick={() => toggleSort(k)}>
      {children} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
               className="border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <Button variant="primary" size="sm" onClick={load} loading={loading}>Load Report</Button>
      </div>

      {data.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['👥', 'Total Students', data.length],
              ['✅', 'Present Days', totalPresent.toLocaleString()],
              ['📊', 'Avg Attendance', `${avgPct}%`],
              ['⚠️', 'At Risk (<75%)', atRisk],
            ].map(([icon, label, val]) => (
              <Card padding="sm" key={label}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-lg font-bold text-slate-800">{val}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[var(--color-border)]">
                    <SortHeader k="roomNo">Room</SortHeader>
                    <SortHeader k="name">Name</SortHeader>
                    <th className="pb-3">Roll No</th>
                    <th className="pb-3">Present</th>
                    <th className="pb-3">Absent</th>
                    <th className="pb-3">Total</th>
                    <SortHeader k="__pct">%</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => {
                    const p = pct(r);
                    return (
                      <tr key={r.studentId} className={[
                        i % 2 ? 'bg-slate-50/50' : '',
                        p < 75 ? 'bg-red-50/40' : '',
                      ].join(' ')}>
                        <td className="py-3 text-slate-600">{r.roomNo}</td>
                        <td className="py-3 font-medium text-slate-800">{r.name}</td>
                        <td className="py-3 text-slate-600">{r.rollNo}</td>
                        <td className="py-3 text-emerald-600 font-medium">{r.presentDays}</td>
                        <td className="py-3 text-red-500">{r.absentDays}</td>
                        <td className="py-3 text-slate-600">{r.totalDays}</td>
                        <td className="py-3 w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div className={`h-full rounded-full ${pctColor(p)}`} style={{ width: `${p}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${pctText(p)}`}>{p}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {!loading && data.length === 0 && (
        <Card><p className="text-center text-sm text-slate-400 py-8">Select a month and load report</p></Card>
      )}
    </div>
  );
}
