import { useState, useRef } from 'react';
import { getReport } from '../../api/attendance';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { Calendar, Search, ArrowDownWideNarrow, Users, Sparkles, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

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
  General:    'bg-slate-100 text-slate-600 border-slate-200',
  OBC:        'bg-blue-50  text-blue-700  border-blue-200',
  SC:         'bg-violet-50 text-violet-700 border-violet-200',
  ST:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  OEC:        'bg-amber-50  text-amber-700  border-amber-200',
  Fisheries:  'bg-cyan-50   text-cyan-700   border-cyan-200',
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

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute z-50 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 w-64 animate-fade-in"
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
          </div>
        </>
      )}
    </div>
  );
}

const getDeptShortcut = (dept) => {
  if (!dept) return '—';
  const d = dept.toLowerCase().trim();
  if (d.includes('computer') || d === 'cse' || d.includes('computational')) return 'CSE';
  if (d.includes('electronics and communication') || d === 'ece') return 'ECE';
  if (d.includes('electrical and electronics') || d === 'eee') return 'EEE';
  if (d.includes('civil') || d === 'ce') return 'CE';
  if (d.includes('mechanical') || d === 'me') return 'ME';
  
  const match = dept.match(/\(([^)]+)\)/);
  if (match) return match[1].toUpperCase();

  return dept.length > 5 ? dept.split(/\s+/).map(w => w[0]).join('').toUpperCase() : dept.toUpperCase();
};

export default function AttendanceTab() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState('roomNo');
  const [sortDir, setSortDir] = useState(1);
  const [filterSearch, setFilterSearch] = useState('');

  const [filterSem, setFilterSem] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCat, setFilterCat] = useState('all');

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

  const filtered = data.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (r.roomNo || '').toLowerCase().includes(filterSearch.toLowerCase());
    
    if (!matchesSearch) return false;

    const matchesSem = filterSem === 'all' || r.semester === filterSem;
    const matchesDept = filterDept === 'all' || getDeptShortcut(r.department) === filterDept;
    
    const matchesCat = filterCat === 'all' || 
      (filterCat === 'obc_general' && (r.category === 'OBC' || r.category === 'General' || !r.category)) ||
      (r.category === filterCat);

    return matchesSem && matchesDept && matchesCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'number') return (av - bv) * sortDir;
    return String(av).localeCompare(String(bv)) * sortDir;
  });

  const SortHeader = ({ k, children, className = '' }) => (
    <th className={`py-4 cursor-pointer select-none hover:text-slate-800 transition-colors uppercase tracking-wider text-[10px] font-bold ${className}`}
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
      <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col lg:flex-row gap-3 flex-1 w-full max-w-5xl">
          <div className="relative min-w-[180px]">
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          {data.length > 0 && (
            <>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Search name, room, roll..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-smooth text-slate-800"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Semester Filter */}
                <select
                  value={filterSem}
                  onChange={(e) => setFilterSem(e.target.value)}
                  className="px-3 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth cursor-pointer text-slate-600"
                >
                  <option value="all">All Semesters</option>
                  <option value="S1">S1</option>
                  <option value="S3">S3</option>
                  <option value="S5">S5</option>
                  <option value="S7">S7</option>
                </select>

                {/* Department Filter */}
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-3 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth cursor-pointer text-slate-600"
                >
                  <option value="all">All Depts</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="CE">CE</option>
                  <option value="ME">ME</option>
                </select>

                {/* Category Filter */}
                <select
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                  className="px-3 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth cursor-pointer text-slate-600"
                >
                  <option value="all">All Categories</option>
                  <option value="obc_general">OBC / General</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="OEC">OEC</option>
                  <option value="Fisheries">Fisheries</option>
                </select>

                {(filterSem !== 'all' || filterDept !== 'all' || filterCat !== 'all') && (
                  <button
                    onClick={() => { setFilterSem('all'); setFilterDept('all'); setFilterCat('all'); }}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl text-xs font-bold transition-smooth cursor-pointer flex items-center justify-center"
                    title="Clear Filters"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <button
          onClick={load}
          className="w-full md:w-auto py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 cursor-pointer shadow-glow shrink-0"
        >
          {loading ? <Spinner size="sm" color="white" /> : 'Retrieve Sheets'}
        </button>
      </div>

      {data.length > 0 && (
        <>
          {/* Statistical Highlight */}
          <div className="max-w-xs">
            <div
              className="p-5 rounded-3xl border shadow-premium bg-white flex items-center justify-between relative overflow-hidden hover:-translate-y-0.5 transition-smooth"
            >
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Enrolled Residents</p>
                <h4 className="text-3xl font-black text-slate-800 mt-1.5 font-sans leading-none">{data.length}</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">profiles</p>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border-indigo-100 border">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Dataset View table */}
          <Card padding="none" className="overflow-hidden border border-slate-200/50 rounded-3xl shadow-premium bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <SortHeader k="roomNo" className="pl-4">Room</SortHeader>
                    <SortHeader k="name">Resident</SortHeader>
                    <SortHeader k="semester">Sem</SortHeader>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Roll No</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-emerald-600">Present</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-red-500">Absent</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-amber-600">MC Days</th>
                    <SortHeader k="messCut" className="pr-4 text-orange-600">Mess Cut</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, idx) => {
                    const mc = r.messCut ?? 0;
                    return (
                      <tr
                        key={r.studentId}
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
                        <td className="py-4 text-xs font-bold text-indigo-600 uppercase">{r.semester || 'S1'}</td>
                        <td className="py-4 text-xs font-semibold text-slate-500">{r.rollNo}</td>
                        <td className="py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${catStyle[r.category] || catStyle.General}`}>
                            {r.category || 'General'}
                          </span>
                        </td>
                        <td className="py-4 text-emerald-600 font-extrabold text-xs">{r.presentDays}</td>
                        <td className="py-4 text-red-500 font-semibold text-xs">{r.absentDays}</td>
                        <td className="py-4 text-amber-600 font-semibold text-xs">{r.messCutDays ?? 0}</td>
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
        <div className="bg-white rounded-3xl border border-slate-200/50 p-16 shadow-premium text-center space-y-3">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 font-bold">Select a month and retrieve attendance sheets</p>
        </div>
      )}
    </div>
  );
}
