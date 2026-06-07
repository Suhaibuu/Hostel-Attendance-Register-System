import { useState } from 'react';
import { getReport } from '../../api/attendance';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { Calendar, Search, ArrowDownWideNarrow, Percent, ShieldCheck, ShieldAlert, Sparkles, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

const currentMonth = () => new Date().toISOString().slice(0, 7);

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
const getColor = (n) => avatarColors[(n || 'A').charCodeAt(0) % avatarColors.length];
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

export default function AttendanceTab() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState('roomNo');
  const [sortDir, setSortDir] = useState(1);
  const [filterSearch, setFilterSearch] = useState('');

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

  const filtered = data.filter(r => 
    r.name.toLowerCase().includes(filterSearch.toLowerCase()) || 
    r.rollNo.toLowerCase().includes(filterSearch.toLowerCase()) ||
    (r.roomNo || '').toLowerCase().includes(filterSearch.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'number') return (av - bv) * sortDir;
    return String(av).localeCompare(String(bv)) * sortDir;
  });

  const totalPresent = data.reduce((s, r) => s + r.presentDays, 0);
  const totalPossible = data.reduce((s, r) => s + r.totalDays, 0);
  const avgPct = totalPossible ? Math.round((totalPresent / totalPossible) * 100) : 0;

  const pct = (r) => r.totalDays ? Math.round((r.presentDays / r.totalDays) * 100) : 0;
  const pctColor = (p) => p >= 75 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-400' : 'bg-red-500';
  const pctBg = (p) => p >= 75 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : p >= 50 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700';

  const SortHeader = ({ k, children }) => (
    <th className="py-4 cursor-pointer select-none hover:text-slate-800 transition-colors uppercase tracking-wider text-[10px] font-bold"
        onClick={() => toggleSort(k)}>
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        {sortKey === k && <ArrowDownWideNarrow className={`w-3.5 h-3.5 transition-transform ${sortDir === 1 ? '' : 'rotate-180'}`} />}
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      
      {/* Control panel options */}
      <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="month" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-smooth text-slate-800" 
            />
          </div>
          {data.length > 0 && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={filterSearch} 
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Filter results..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-smooth text-slate-800" 
              />
            </div>
          )}
        </div>

        <button 
          onClick={load}
          className="w-full sm:w-auto py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 cursor-pointer shadow-glow"
        >
          {loading ? <Spinner size="sm" color="white" /> : 'Retrieve Sheets'}
        </button>
      </div>

      {data.length > 0 && (
        <>
          {/* Statistical Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Enrolled Residents', val: data.length, suffix: 'profiles', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
              { label: 'Check-In Dockets', val: totalPresent.toLocaleString(), suffix: 'records', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              { label: 'Avg Attendance', val: `${avgPct}%`, suffix: 'ratio', color: 'bg-violet-50 text-violet-700 border-violet-100' },
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                whileHover={{ y: -2 }}
                className={`p-5 rounded-3xl border shadow-premium bg-white flex items-center justify-between relative overflow-hidden`}
              >
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-1.5 font-sans leading-none">{stat.val}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">{stat.suffix}</p>
                </div>
                <div className={`p-3 rounded-2xl ${stat.color} border`}>
                  <Percent className="w-5 h-5" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Dataset View table representation */}
          <Card padding="none" className="overflow-hidden border border-slate-200/50 rounded-3xl shadow-premium bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="py-4 pl-4"><SortHeader k="roomNo">Room</SortHeader></th>
                    <th className="py-4"><SortHeader k="name">Resident</SortHeader></th>
                    <th className="py-4">Roll No</th>
                    <th className="py-4 text-emerald-600">Present</th>
                    <th className="py-4 text-red-500">Absent</th>
                    <th className="py-4 text-slate-500">Total</th>
                    <th className="py-4 pr-4"><SortHeader k="__pct">Ratio</SortHeader></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, idx) => {
                    const p = pct(r);
                    return (
                      <motion.tr 
                        key={r.studentId} 
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.25) }}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-smooth group"
                      >
                        <td className="py-4 pl-4 font-extrabold text-slate-800 text-xs">{r.roomNo}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm ${getColor(r.name)}`}>
                              {initials(r.name)}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{r.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-xs font-semibold text-slate-500">{r.rollNo}</td>
                        <td className="py-4 text-emerald-600 font-extrabold text-xs">{r.presentDays}</td>
                        <td className="py-4 text-red-500 font-semibold text-xs">{r.absentDays}</td>
                        <td className="py-4 text-slate-500 font-semibold text-xs">{r.totalDays}</td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/20">
                              <div className={`h-full rounded-full ${pctColor(p)}`} style={{ width: `${p}%` }} />
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${pctBg(p)}`}>
                              {p}%
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {!loading && data.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/50 p-16 shadow-premium text-center space-y-3">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 font-bold">Select a month and retrieve attendance sheets</p>
        </div>
      )}
    </div>
  );
}
