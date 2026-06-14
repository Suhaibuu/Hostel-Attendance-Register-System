import { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deactivateStudent, deleteStudent } from '../../api/students';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StudentModal from './StudentModal';
import StudentHistoryModal from './StudentHistoryModal';
import AssignRoomModal from './AssignRoomModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, SlidersHorizontal, Plus, Users, UserMinus, UserCheck, 
  Trash2, Edit3, CalendarDays, KeyRound, MapPin, Layers 
} from 'lucide-react';

const avatarColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
const getColor = (n) => avatarColors[(n || 'A').charCodeAt(0) % avatarColors.length];
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

function StudentRow({ s, idx, onEdit, onDeactivate, onHistory, onAssignRoom, onDelete }) {
  const isEven = idx % 2 === 0;

  return (
    <motion.tr 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
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
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{s.rollNo}</span>
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
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAssignRoom(s)} 
            className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5 cursor-pointer transition-smooth hover:bg-amber-100"
          >
            Assign Room
          </motion.button>
        )}
      </td>
      <td className="py-4 text-xs font-bold text-slate-600 hidden md:table-cell">{s.department || '—'}</td>
      <td className="py-4 text-xs font-bold text-slate-600 hidden md:table-cell">
        <span className="px-2 py-0.5 bg-slate-100/80 rounded border border-slate-200/10">{s.level || 'UG'}</span>
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
    </motion.tr>
  );
}

function StudentTable({ rows, loading, onEdit, onDeactivate, onHistory, onAssignRoom, onDelete }) {
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
                <th className="py-4 hidden md:table-cell">Dept</th>
                <th className="py-4 hidden md:table-cell">Level</th>
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

  const load = async () => {
    setLoading(true);
    try { setStudents(await getStudents({ all: 'true' })); }
    catch { setStudents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const q = search.toLowerCase();
  const activeStudents     = students.filter((s) =>  s.active && !!s.roomNo && (s.name.toLowerCase().includes(q) || s.roomNo.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)));
  const unallottedStudents = students.filter((s) =>  s.active && !s.roomNo && (s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)));
  const alumniStudents     = students.filter((s) => !s.active && (s.name.toLowerCase().includes(q) || (s.roomNo || '').toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)));
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

  return (
    <div className="space-y-6">
      
      {/* Top filter bar operations - Asymmetric layout */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search tool panel */}
        <div className="relative w-full max-w-sm shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll, or room..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-smooth" 
          />
        </div>

        {/* Dynamic sliding sub-tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {[
            { id: 'active', label: 'Allotted', count: students.filter(s=>s.active && !!s.roomNo).length },
            { id: 'unallotted', label: 'Unallotted', count: students.filter(s=>s.active && !s.roomNo).length },
            { id: 'alumni', label: 'Passed Out', count: students.filter(s=>!s.active).length },
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
