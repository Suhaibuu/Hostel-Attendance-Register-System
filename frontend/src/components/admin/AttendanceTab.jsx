import { useState, useRef } from 'react';
import { getReport, getDateReport } from '../../api/attendance';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { Calendar, Search, ArrowDownWideNarrow, Users, Sparkles, ChevronLeft, ChevronRight, RotateCcw, LayoutList, CalendarDays, Download } from 'lucide-react';

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
const getColor = (n) => avatarColors[(n || 'A').charCodeAt(0) % avatarColors.length];
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const catStyle = {
  General: 'bg-slate-100 text-slate-600 border-slate-200',
  OBC: 'bg-blue-50 text-blue-700 border-blue-200',
  SC: 'bg-violet-50 text-violet-700 border-violet-200',
  ST: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OEC: 'bg-amber-50 text-amber-700 border-amber-200',
  Fisheries: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

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

/* ── Month Picker (unchanged) ── */
function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseInt(value.split('-')[0]));
  const ref = useRef(null);
  const [selYear, selMonthIdx] = value.split('-').map(Number);
  const pick = (m) => { onChange(`${viewYear}-${String(m + 1).padStart(2, '0')}`); setOpen(false); };
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth text-slate-800 cursor-pointer">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {MONTHS[selMonthIdx - 1]} {selYear}
      </button>
      {open && (<>
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div className="absolute z-50 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 w-64 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setViewYear(y => y - 1)} className="p-1.5 rounded-xl hover:bg-slate-100 transition-smooth cursor-pointer"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
            <span className="text-sm font-black text-slate-800">{viewYear}</span>
            <button onClick={() => setViewYear(y => y + 1)} className="p-1.5 rounded-xl hover:bg-slate-100 transition-smooth cursor-pointer"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, i) => (
              <button key={m} onClick={() => pick(i)}
                className={`py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${viewYear === selYear && i + 1 === selMonthIdx ? 'bg-primary-600 text-white shadow-glow' : 'hover:bg-slate-100 text-slate-700'}`}>
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </>)}
    </div>
  );
}

/* ── Shared filter logic ── */
function applyFilters(data, filterSearch, filterSem, filterDept, filterCat, filterStatus) {
  return data.filter(r => {
    const s = filterSearch.toLowerCase();
    if (s && !r.name.toLowerCase().includes(s) && !r.rollNo.toLowerCase().includes(s) && !(r.roomNo || '').toLowerCase().includes(s)) return false;
    if (filterSem !== 'all' && r.semester !== filterSem) return false;
    if (filterDept !== 'all' && getDeptShortcut(r.department) !== filterDept) return false;
    if (filterCat !== 'all') {
      if (filterCat === 'obc_general') { if (r.category !== 'OBC' && r.category !== 'General' && r.category) return false; }
      else if (r.category !== filterCat) return false;
    }
    if (filterStatus && filterStatus !== 'all') {
      if (filterStatus === 'present' && r.present !== true) return false;
      if (filterStatus === 'absent' && r.present !== false) return false;
      if (filterStatus === 'messcut' && !r.messCut) return false;
      if (filterStatus === 'unmarked' && r.present !== null && r.present !== undefined) return false;
    }
    return true;
  });
}

/* ── Filter Controls ── */
function FilterControls({ filterSearch, setFilterSearch, filterSem, setFilterSem, filterDept, setFilterDept, filterCat, setFilterCat, filterStatus, setFilterStatus, showStatusFilter }) {
  const selectCls = "px-3 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth cursor-pointer text-slate-600";
  const hasActiveFilter = filterSem !== 'all' || filterDept !== 'all' || filterCat !== 'all' || (showStatusFilter && filterStatus !== 'all');
  return (<>
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Search name, room, roll..."
        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-smooth text-slate-800" />
    </div>
    <div className="flex flex-wrap gap-2 items-center">
      <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className={selectCls}>
        <option value="all">All Semesters</option>
        <option value="S1">S1</option><option value="S3">S3</option><option value="S5">S5</option><option value="S7">S7</option>
      </select>
      <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={selectCls}>
        <option value="all">All Depts</option>
        <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="CE">CE</option><option value="ME">ME</option>
      </select>
      <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={selectCls}>
        <option value="all">All Categories</option>
        <option value="obc_general">OBC / General</option><option value="SC">SC</option><option value="ST">ST</option><option value="OEC">OEC</option><option value="Fisheries">Fisheries</option>
      </select>
      {showStatusFilter && (
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="messcut">Mess Cut</option>
          <option value="unmarked">Unmarked</option>
        </select>
      )}
      {hasActiveFilter && (
        <button onClick={() => { setFilterSem('all'); setFilterDept('all'); setFilterCat('all'); if (setFilterStatus) setFilterStatus('all'); }}
          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl text-xs font-bold transition-smooth cursor-pointer flex items-center justify-center" title="Clear Filters">
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
    </div>
  </>);
}

/* ── Sort Header ── */
function SortHeader({ k, sortKey, sortDir, toggleSort, children, className = '' }) {
  return (
    <th className={`py-4 cursor-pointer select-none hover:text-slate-800 transition-colors uppercase tracking-wider text-[10px] font-bold ${className}`} onClick={() => toggleSort(k)}>
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        {sortKey === k && <ArrowDownWideNarrow className={`w-3.5 h-3.5 transition-transform ${sortDir === 1 ? '' : 'rotate-180'}`} />}
      </div>
    </th>
  );
}

/* ── Status Badge for day-wise ── */
function StatusBadge({ present, messCut }) {
  if (present === null || present === undefined) {
    return <span className="text-xs font-black px-3 py-1 rounded-xl border bg-slate-50 text-slate-400 border-slate-200">Unmarked</span>;
  }
  if (present && messCut) {
    return <span className="text-xs font-black px-3 py-1 rounded-xl border bg-amber-50 text-amber-700 border-amber-200">Present · MC</span>;
  }
  if (present) {
    return <span className="text-xs font-black px-3 py-1 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">Present</span>;
  }
  if (messCut) {
    return <span className="text-xs font-black px-3 py-1 rounded-xl border bg-amber-50 text-amber-700 border-amber-200">Absent · MC</span>;
  }
  return <span className="text-xs font-black px-3 py-1 rounded-xl border bg-red-50 text-red-600 border-red-200">Absent</span>;
}

/* ═══════════ Main Component ═══════════ */
export default function AttendanceTab() {
  const [viewMode, setViewMode] = useState('monthly');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [monthlyData, setMonthlyData] = useState([]);
  const [dateData, setDateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState('roomNo');
  const [sortDir, setSortDir] = useState(1);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSem, setFilterSem] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const hasData = viewMode === 'monthly' ? monthlyData.length > 0 : dateData !== null;

  const load = async () => {
    setLoading(true);
    try {
      if (viewMode === 'monthly') { setMonthlyData(await getReport(month)); }
      else { setDateData(await getDateReport(selectedDate)); }
    } catch { viewMode === 'monthly' ? setMonthlyData([]) : setDateData(null); }
    finally { setLoading(false); }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(1); }
  };

  const switchMode = (mode) => {
    setViewMode(mode);
    setFilterStatus('all');
    if (mode === 'monthly') setDateData(null); else setMonthlyData([]);
  };

  // Active dataset for filters
  const activeData = viewMode === 'monthly' ? monthlyData : (dateData?.report || []);
  const filtered = applyFilters(activeData, filterSearch, filterSem, filterDept, filterCat, viewMode === 'daily' ? filterStatus : 'all');
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'number') return (av - bv) * sortDir;
    return String(av ?? '').localeCompare(String(bv ?? '')) * sortDir;
  });

  // Stats for day-wise
  const dateStats = dateData ? {
    present: dateData.report.filter(r => r.present === true).length,
    absent: dateData.report.filter(r => r.present === false).length,
    unmarked: dateData.report.filter(r => r.present === null).length,
  } : null;

  const handleDownloadCSV = () => {
    // 1. Determine number of days in the selected month
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const noOfDays = new Date(year, monthIndex + 1, 0).getDate();

    // 2. Prepare CSV rows (using sorted/filtered data)
    const rows = [
      ['SL. NO', 'NAME', 'ROOM NO', 'CLASS', 'SC/ST/OEC/FISCHERIES', 'NO OF DAYS', 'MESS CUT', 'NO OF PRE DAYS']
    ];

    sorted.forEach((r, index) => {
      const slNo = index + 1;
      const name = r.name || '';
      const roomNo = r.roomNo || '';
      const dept = getDeptShortcut(r.department);
      const studentClass = (r.semester || '') + dept;
      const cat = r.category || '';
      // Only include specific categories as requested
      const specialCat = ['SC', 'ST', 'OEC', 'Fisheries'].includes(cat) ? (cat === 'Fisheries' ? 'FISCHERIES' : cat) : '';
      const messCut = r.messCut ?? 0;
      const preDays = r.presentDays ?? 0;

      rows.push([
        slNo,
        `"${name}"`,
        `"${roomNo}"`,
        `"${studentClass}"`,
        `"${specialCat}"`,
        noOfDays,
        messCut,
        preDays
      ]);
    });

    const csvString = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Format month name (e.g., FEBRUARY-2025)
    const monthName = MONTHS[monthIndex].toUpperCase();
    link.setAttribute('download', `${monthName}_${year}_ATTENDANCE.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Control Panel ── */}
      <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium space-y-4">
        {/* Row 1: Toggle + Picker + Retrieve */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* View Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-2xl shrink-0">
            <button onClick={() => switchMode('monthly')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${viewMode === 'monthly' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutList className="w-3.5 h-3.5" /> Monthly
            </button>
            <button onClick={() => switchMode('daily')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${viewMode === 'daily' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <CalendarDays className="w-3.5 h-3.5" /> Day-wise
            </button>
          </div>

          {/* Date / Month picker */}
          <div className="relative min-w-[180px]">
            {viewMode === 'monthly' ? (
              <MonthPicker value={month} onChange={setMonth} />
            ) : (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth text-slate-800 cursor-pointer" />
              </div>
            )}
          </div>

          <div className="flex-1" />

          <button onClick={load}
            className="w-full sm:w-auto py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 cursor-pointer shadow-glow shrink-0">
            {loading ? <Spinner size="sm" color="white" /> : 'Retrieve Sheets'}
          </button>
        </div>

        {/* Row 2: Search + Filters (only when data loaded) */}
        {hasData && (
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <FilterControls {...{ filterSearch, setFilterSearch, filterSem, setFilterSem, filterDept, setFilterDept, filterCat, setFilterCat, filterStatus, setFilterStatus, showStatusFilter: viewMode === 'daily' }} />
            
            {viewMode === 'monthly' && (
              <button 
                onClick={handleDownloadCSV}
                className="ml-auto px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold transition-smooth flex items-center justify-center gap-2 cursor-pointer border border-emerald-200/60 shrink-0"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {hasData && (
        <div key={viewMode} className="animate-fade-only space-y-6">
          {/* Stats cards */}
          {viewMode === 'monthly' ? (
            <div className="max-w-xs">
              <div className="p-5 rounded-3xl border shadow-premium bg-white flex items-center justify-between hover:-translate-y-0.5 transition-smooth">
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Enrolled Residents</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-1.5 leading-none">{monthlyData.length}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">profiles</p>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border-indigo-100 border"><Users className="w-5 h-5" /></div>
              </div>
            </div>
          ) : dateStats && (
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Present', value: dateStats.present, color: 'emerald' },
                { label: 'Absent', value: dateStats.absent, color: 'red' },
                { label: 'Unmarked', value: dateStats.unmarked, color: 'slate' },
              ].map(s => (
                <div key={s.label} className="p-5 rounded-3xl border shadow-premium bg-white flex items-center gap-4 hover:-translate-y-0.5 transition-smooth min-w-[150px]">
                  <div>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{s.label}</p>
                    <h4 className={`text-3xl font-black mt-1.5 leading-none text-${s.color}-600`}>{s.value}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <Card padding="none" className="overflow-hidden border border-slate-200/50 rounded-3xl shadow-premium bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <SortHeader k="roomNo" sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} className="pl-4">Room</SortHeader>
                    <SortHeader k="name" sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort}>Resident</SortHeader>
                    <SortHeader k="semester" sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort}>Sem</SortHeader>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Roll No</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                    {viewMode === 'monthly' ? (<>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-emerald-600">Present</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-red-500">Absent</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-amber-600">MC Days</th>
                      <SortHeader k="messCut" sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} className="pr-4 text-orange-600">Mess Cut</SortHeader>
                    </>) : (
                      <th className="py-4 text-[10px] font-bold uppercase tracking-wider text-primary-600 pr-4">Status</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.studentId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-smooth group">
                      <td className="py-4 pl-4 font-extrabold text-slate-800 text-xs">{r.roomNo}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm ${getColor(r.name)}`}>{initials(r.name)}</div>
                          <span className="font-bold text-slate-800 text-sm">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-bold text-indigo-600 uppercase">{r.semester || 'S1'}</td>
                      <td className="py-4 text-xs font-semibold text-slate-500">{r.rollNo}</td>
                      <td className="py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${catStyle[r.category] || catStyle.General}`}>{r.category || 'General'}</span>
                      </td>
                      {viewMode === 'monthly' ? (<>
                        <td className="py-4 text-emerald-600 font-extrabold text-xs">{r.presentDays}</td>
                        <td className="py-4 text-red-500 font-semibold text-xs">{r.absentDays}</td>
                        <td className="py-4 text-amber-600 font-semibold text-xs">{r.messCutDays ?? 0}</td>
                        <td className="py-4 pr-4">
                          {(() => { const mc = r.messCut ?? 0; return (
                            <span className={`text-xs font-black px-3 py-1 rounded-xl border ${mc === 0 ? 'bg-slate-50 text-slate-400 border-slate-200' : mc <= 2 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {mc === 0 ? '—' : `-${mc}`}
                            </span>
                          ); })()}
                        </td>
                      </>) : (
                        <td className="py-4 pr-4"><StatusBadge present={r.present} messCut={r.messCut} /></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {!loading && !hasData && (
        <div className="bg-white rounded-3xl border border-slate-200/50 p-16 shadow-premium text-center space-y-3">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 font-bold">Select a {viewMode === 'monthly' ? 'month' : 'date'} and retrieve attendance sheets</p>
        </div>
      )}
    </div>
  );
}
