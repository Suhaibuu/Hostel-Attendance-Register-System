import { useState, useEffect, useMemo } from 'react';
import { getStudents, createStudent, updateStudent, deactivateStudent, reactivateStudent, deleteStudent } from '../../api/students';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StudentModal from './StudentModal';
import StudentHistoryModal from './StudentHistoryModal';
import AssignRoomModal from './AssignRoomModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, SlidersHorizontal, Plus, Users, UserMinus, UserCheck, 
  Trash2, Edit3, CalendarDays, KeyRound, MapPin, Layers, RotateCcw 
} from 'lucide-react';

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
const getColor = (n) => avatarColors[(n || 'A').charCodeAt(0) % avatarColors.length];
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const getDeptShortcut = (dept) => {
  if (!dept) return '—';
  const d = dept.toLowerCase().trim();
  if (d.includes('computer') || d === 'cse' || d.includes('computational')) return 'CSE';
  if (d.includes('electronics and communication') || d === 'ece') return 'ECE';
  if (d.includes('electrical and electronics') || d === 'eee') return 'EEE';
  if (d.includes('civil') || d === 'ce') return 'CE';
  if (d.includes('mechanical') || d === 'me') return 'ME';
  
  // Try extracting parenthesis content e.g. (ECE), (EEE), (CE), etc.
  const match = dept.match(/\(([^)]+)\)/);
  if (match) return match[1].toUpperCase();

  return dept.length > 5 ? dept.split(/\s+/).map(w => w[0]).join('').toUpperCase() : dept.toUpperCase();
};

function StudentRow({ s, idx, onEdit, onDeactivate, onReactivate, onHistory, onAssignRoom, onDelete }) {
  const isEven = idx % 2 === 0;

  return (
    <tr 
      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-smooth group`}
    >
      <td className="py-4 pl-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm ${getColor(s.name)}`}>
            {initials(s.name)}
          </div>
          <div className="min-w-0">
            <button
              onClick={() => onHistory(s)}
              className="font-bold text-slate-800 hover:text-primary-600 transition-colors truncate max-w-[160px] cursor-pointer text-left block text-sm"
              title="View attendance registry"
            >
              {s.name}
            </button>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-wrap">
              <span>{s.rollNo}</span>
              <span className="h-1 w-1 bg-slate-300 rounded-full shrink-0" />
              <span className="text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded uppercase shrink-0">{s.semester || 'S1'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="py-4">
        {s.roomNo ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/40 px-2 py-0.5 rounded-lg">
            <MapPin className="w-3 h-3 text-slate-400" />
            {s.roomNo}
          </span>
        ) : (
          <button 
            onClick={() => onAssignRoom(s)} 
            className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5 cursor-pointer transition-smooth hover:bg-amber-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            Assign Room
          </button>
        )}
      </td>
      <td className="py-4 text-xs font-bold text-slate-600 hidden sm:table-cell">
        <span className="px-2 py-0.5 bg-slate-100/80 rounded border border-slate-200/10 uppercase text-[10px] font-black tracking-wider">{s.category || 'General'}</span>
      </td>
      <td className="py-4 text-xs font-bold text-slate-600 hidden md:table-cell">
        <span className="px-2 py-0.5 bg-slate-100/80 rounded border border-slate-200/10 uppercase">{getDeptShortcut(s.department)}</span>
      </td>
      <td className="py-4 text-xs font-bold text-slate-600 hidden md:table-cell">
        <span className="px-2 py-0.5 bg-slate-100/80 rounded border border-slate-200/10">{s.level || 'UG'}</span>
      </td>
      <td className="py-4 text-xs font-bold text-slate-600 hidden sm:table-cell">
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">{s.semester || '—'}</span>
      </td>
      <td className="py-4 text-xs font-bold text-slate-600 hidden sm:table-cell">
        {s.phone ? `+91 ${s.phone}` : '—'}
      </td>
      <td className="py-4">
        <Badge variant={s.active ? 'present' : 'absent'}>
          {s.active ? 'Active' : 'Passed Out'}
        </Badge>
      </td>
      <td className="py-4 pr-4 text-right">
        <div className="flex gap-1.5 justify-end opacity-90 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onHistory(s)} 
            title="Registry History"
            className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-500 border border-slate-200/20 cursor-pointer transition-smooth"
          >
            <CalendarDays className="w-3.5 h-3.5" />
          </button>
          
          {onEdit && (
            <button 
              onClick={() => onEdit(s)}
              title="Edit Profile"
              className="p-1.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-600 rounded-lg text-slate-500 border border-slate-200/20 cursor-pointer transition-smooth"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDeactivate && s.active && (
            <button 
              onClick={() => onDeactivate(s._id)}
              title="Mark Passed Out"
              className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 rounded-lg text-slate-500 border border-slate-200/20 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-smooth"
            >
              Pass Out
            </button>
          )}

          {onReactivate && !s.active && (
            <button 
              onClick={() => onReactivate(s._id)}
              title="Roll back to Active"
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-500 border border-slate-200/20 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-smooth flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reactivate
            </button>
          )}

          {onDelete && (
            <button 
              onClick={() => onDelete(s)} 
              title="Delete Resident"
              className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-500 border border-slate-200/20 cursor-pointer transition-smooth"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StudentTable({ rows, loading, onEdit, onDeactivate, onReactivate, onHistory, onAssignRoom, onDelete }) {
  return (
    <Card padding="none" className="overflow-hidden border border-slate-200/50 rounded-3xl shadow-premium bg-white">
      {loading ? (
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 font-bold">No active resident profiles found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 pl-4">Resident</th>
                <th className="py-4">Room No</th>
                <th className="py-4 hidden sm:table-cell">Category</th>
                <th className="py-4 hidden md:table-cell">Dept</th>
                <th className="py-4 hidden md:table-cell">Level</th>
                <th className="py-4 hidden sm:table-cell">Semester</th>
                <th className="py-4 hidden sm:table-cell">Phone</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right pr-4">Operations</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, idx) => (
                <StudentRow 
                  key={s._id} 
                  s={s} 
                  idx={idx} 
                  onEdit={onEdit} 
                  onDeactivate={onDeactivate}
                  onReactivate={onReactivate}
                  onHistory={onHistory} 
                  onAssignRoom={onAssignRoom} 
                  onDelete={onDelete} 
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subTab, setSubTab] = useState('active'); // 'active' | 'unallotted' | 'alumni'
  const [modal, setModal] = useState(null);         // null | 'add' | student obj
  const [historyStudent, setHistoryStudent] = useState(null);
  const [assignRoomModal, setAssignRoomModal] = useState(null);

  const [filterSem, setFilterSem] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCat, setFilterCat] = useState('all');

  const load = async () => {
    setLoading(true);
    try { setStudents(await getStudents({ all: 'true' })); }
    catch { setStudents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const q = search.toLowerCase();
  // Single-pass categorization instead of 3 separate filter passes
  const { activeStudents, unallottedStudents, alumniStudents } = useMemo(() => {
    const active = [];
    const unallotted = [];
    const alumni = [];
    for (const s of students) {
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || (s.roomNo || '').toLowerCase().includes(q);
      if (!matchesSearch) continue;

      const matchesSem = filterSem === 'all' || s.semester === filterSem;
      const matchesDept = filterDept === 'all' || getDeptShortcut(s.department) === filterDept;
      
      const matchesCat = filterCat === 'all' || 
        (filterCat === 'obc_general' && (s.category === 'OBC' || s.category === 'General' || !s.category)) ||
        (s.category === filterCat);

      if (!matchesSem || !matchesDept || !matchesCat) continue;

      if (!s.active) alumni.push(s);
      else if (s.roomNo) active.push(s);
      else unallotted.push(s);
    }
    return { activeStudents: active, unallottedStudents: unallotted, alumniStudents: alumni };
  }, [students, q, filterSem, filterDept, filterCat]);
  const displayed          = subTab === 'active' ? activeStudents : subTab === 'unallotted' ? unallottedStudents : alumniStudents;

  const handleSave = async (form) => {
    if (modal && modal._id) await updateStudent(modal._id, form);
    else await createStudent(form);
    setModal(null);
    load();
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Mark this student as Passed Out? Their attendance history will be preserved.')) return;
    await deactivateStudent(id);
    load();
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${student.name} (${student.rollNo})?\n\nThis will permanently delete all of their attendance records and cannot be undone.`)) {
      return;
    }
    try {
      await deleteStudent(student._id);
      load();
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const handleReactivate = async (id) => {
    if (!window.confirm('Reactivate this student? They will be moved back to active status.')) return;
    try {
      await reactivateStudent(id);
      load();
    } catch (err) {
      alert(err.message || 'Failed to reactivate student');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top filter bar operations - Asymmetric layout */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        
        {/* Search & Filter tools panel */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full max-w-4xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll, or room..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-smooth" 
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Semester Filter */}
            <select
              value={filterSem}
              onChange={(e) => setFilterSem(e.target.value)}
              className="px-3 py-3 bg-white border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth cursor-pointer text-slate-600"
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
              className="px-3 py-3 bg-white border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth cursor-pointer text-slate-600"
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
              className="px-3 py-3 bg-white border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:border-primary-500 transition-smooth cursor-pointer text-slate-600"
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
        </div>

        {/* Dynamic sliding sub-tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap w-full xl:w-auto justify-start xl:justify-end">
          {[
            { id: 'active', label: 'Allotted', count: activeStudents.length },
            { id: 'unallotted', label: 'Unallotted', count: unallottedStudents.length },
            { id: 'alumni', label: 'Passed Out', count: alumniStudents.length },
          ].map((t) => {
            const isSelected = subTab === t.id;
            return (
              <button 
                key={t.id} 
                onClick={() => setSubTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-smooth cursor-pointer ${
                  isSelected ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label} ({t.count})
              </button>
            );
          })}
        </div>

        <button 
          onClick={() => setModal('add')}
          className="w-full sm:w-auto py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 cursor-pointer shadow-glow"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>

      </div>

      {/* Main Interactive Table */}
      <StudentTable
        rows={displayed}
        loading={loading}
        onEdit={(subTab === 'active' || subTab === 'unallotted') ? (s) => setModal(s) : null}
        onDeactivate={(subTab === 'active' || subTab === 'unallotted') ? handleDeactivate : null}
        onReactivate={subTab === 'alumni' ? handleReactivate : null}
        onHistory={setHistoryStudent}
        onAssignRoom={setAssignRoomModal}
        onDelete={handleDelete}
      />

      {/* Modals & Sheet Dialogs */}
      <AnimatePresence>
        {modal && (
          <StudentModal
            student={modal === 'add' ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
        {historyStudent && (
          <StudentHistoryModal
            student={historyStudent}
            onClose={() => setHistoryStudent(null)}
          />
        )}
        {assignRoomModal && (
          <AssignRoomModal
            student={assignRoomModal}
            onSave={() => { setAssignRoomModal(null); load(); }}
            onClose={() => setAssignRoomModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
