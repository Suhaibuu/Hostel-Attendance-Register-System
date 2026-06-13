import { useState, useRef } from 'react';
import { getReport } from '../../api/attendance';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { Calendar, Search, ArrowDownWideNarrow, Percent, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
const getColor = (n) => avatarColors[(n || 'A').charCodeAt(0) % avatarColors.length];
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Category badge colours
const catStyle = {
  General: 'bg-slate-100 text-slate-600 border-slate-200',
  OBC:     'bg-blue-50  text-blue-700  border-blue-200',
  SC:      'bg-violet-50 text-violet-700 border-violet-200',
  ST:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  OEC:     'bg-amber-50  text-amber-700  border-amber-200',
};

function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseInt(value.split('-')[0]));
  const ref = useRef(null);

  const [selYear, selMonthIdx] = value.split('-').map(Number);

  const pick = (m) => {
    onChange(`${viewYear}-${String(m + 1).padStart(2, '0')}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth text-slate-800 cursor-pointer"
      >
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {MONTHS[selMonthIdx - 1]} {selYear}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 w-64"
          >
            {/* Year navigation */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setViewYear(y => y - 1)} className="p-1.5 rounded-xl hover:bg-slate-100 transition-smooth cursor-pointer">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-sm font-black text-slate-800">{viewYear}</span>
              <button onClick={() => setViewYear(y => y + 1)} className="p-1.5 rounded-xl hover:bg-slate-100 transition-smooth cursor-pointer">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((m, i) => {
                const isSelected = viewYear === selYear && i + 1 === selMonthIdx;
                return (
                  <button
                    key={m}
                    onClick={() => pick(i)}
                    className={`py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                      isSelected
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {m.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AttendanceTab() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
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
  const totalMessCuts = data.reduce((s, r) => s + (r.messCut || 0), 0);

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
            <MonthPicker value={month} onChange={setMonth} />
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
              { label: 'Total Mess Cuts', val: totalMessCuts, suffix: 'deductions', color: 'bg-red-50 text-red-700 border-red-100' },
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

          {/* Dataset View table */}
          <Card padding="none" className="overflow-hidden border border-slate-200/50 rounded-3xl shadow-premium bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="py-4 pl-4"><SortHeader k="roomNo">Room</SortHeader></th>
                    <th className="py-4"><SortHeader k="name">Resident</SortHeader></th>
                    <th className="py-4">Roll No</th>
                    <th className="py-4">Category</th>
                    <th className="py-4 text-emerald-600">Present</th>
                    <th className="py-4 text-red-500">Absent</th>
                    <th className="py-4 pr-4 text-orange-600"><SortHeader k="messCut">Mess Cut</SortHeader></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, idx) => {
                    const mc = r.messCut ?? 0;
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
                        <td className="py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${catStyle[r.category] || catStyle.General}`}>
                            {r.category || 'General'}
                          </span>
                        </td>
                        <td className="py-4 text-emerald-600 font-extrabold text-xs">{r.presentDays}</td>
                        <td className="py-4 text-red-500 font-semibold text-xs">{r.absentDays}</td>
                        <td className="py-4 pr-4">
                          <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                            mc === 0
                              ? 'bg-slate-50 text-slate-400 border-slate-200'
                              : mc <= 2
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {mc === 0 ? '—' : `-${mc}`}
                          </span>
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
