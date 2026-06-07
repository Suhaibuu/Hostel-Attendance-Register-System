import { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deactivateStudent, deleteStudent } from '../../api/students';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StudentModal from './StudentModal';
import StudentHistoryModal from './StudentHistoryModal';
import AssignRoomModal from './AssignRoomModal';

const avatarColors = ['bg-blue-500','bg-emerald-500','bg-purple-500','bg-orange-500','bg-pink-500'];
const getColor = (n) => avatarColors[(n||'A').charCodeAt(0) % avatarColors.length];
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0,2).toUpperCase() : (p[0][0]+p[p.length-1][0]).toUpperCase();
};

// ── Shared student row ────────────────────────────────────

function StudentRow({ s, i, onEdit, onDeactivate, onHistory, onAssignRoom, onDelete }) {
  return (
    <tr className={i % 2 ? 'bg-slate-50/50' : ''}>
      <td className="py-3 pl-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getColor(s.name)}`}>
            {initials(s.name)}
          </div>
          <button
            onClick={() => onHistory(s)}
            className="font-medium text-slate-800 hover:text-[var(--color-primary)] transition-colors truncate max-w-[140px] cursor-pointer text-left"
            title="View attendance history"
          >
            {s.name}
          </button>
        </div>
      </td>
      <td className="py-3 text-slate-600">{s.rollNo}</td>
      <td className="py-3 text-slate-600">
        {s.roomNo ? (
          s.roomNo
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onAssignRoom(s)} className="text-amber-600 border-amber-200">Assign Room</Button>
        )}
      </td>
      <td className="py-3 text-slate-600 hidden md:table-cell">{s.department || '—'}</td>
      <td className="py-3 hidden md:table-cell capitalize">{s.messPlan}</td>
      <td className="py-3">
        <Badge variant={s.active ? 'present' : 'absent'}>
          {s.active ? 'Active' : 'Passed Out'}
        </Badge>
      </td>
      <td className="py-3 pr-3 text-right">
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={() => onHistory(s)} title="View history">📋</Button>
          {onEdit && <Button variant="ghost" size="sm" onClick={() => onEdit(s)}>Edit</Button>}
          {onDeactivate && s.active && (
            <Button variant="danger" size="sm" onClick={() => onDeactivate(s._id)}>Passed Out</Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(s)} title="Delete permanently" className="text-red-600 border border-red-200 hover:bg-red-50">Delete</Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Shared table shell ────────────────────────────────────

function StudentTable({ rows, loading, onEdit, onDeactivate, onHistory, onAssignRoom, onDelete }) {
  return (
    <Card padding="sm">
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_,i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl block mb-2">🎓</span>
          <p className="text-sm text-slate-400">No students found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-[var(--color-border)]">
                <th className="pb-3 pl-3">Name</th>
                <th className="pb-3">Roll No</th>
                <th className="pb-3">Room</th>
                <th className="pb-3 hidden md:table-cell">Dept</th>
                <th className="pb-3 hidden md:table-cell">Mess</th>
                <th className="pb-3 hidden md:table-cell">Rate</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <StudentRow key={s._id} s={s} i={i} onEdit={onEdit} onDeactivate={onDeactivate} onHistory={onHistory} onAssignRoom={onAssignRoom} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── Main Tab ──────────────────────────────────────────────

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
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search by name, roll, or room..."
                 className="w-full pl-9 pr-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <Button variant="primary" size="sm" onClick={() => setModal('add')}>+ Add Student</Button>
      </div>

      {/* Sub-tabs: Active | Unallotted | Alumni */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
        {[
          { id: 'active', label: `Active (${students.filter(s=>s.active && !!s.roomNo).length})` },
          { id: 'unallotted', label: `Unallotted (${students.filter(s=>s.active && !s.roomNo).length})` },
          { id: 'alumni', label: `Passed Out (${students.filter(s=>!s.active).length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer',
                    subTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <StudentTable
        rows={displayed}
        loading={loading}
        onEdit={(subTab === 'active' || subTab === 'unallotted') ? (s) => setModal(s) : null}
        onDeactivate={(subTab === 'active' || subTab === 'unallotted') ? handleDeactivate : null}
        onHistory={setHistoryStudent}
        onAssignRoom={setAssignRoomModal}
        onDelete={handleDelete}
      />

      {/* Modals */}
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
    </div>
  );
}
