import { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deactivateStudent } from '../../api/students';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StudentModal from './StudentModal';

const avatarColors = ['bg-blue-500','bg-emerald-500','bg-purple-500','bg-orange-500','bg-pink-500'];
const getColor = (n) => avatarColors[(n||'A').charCodeAt(0) % avatarColors.length];
const initials = (n) => {
  if (!n) return '??';
  const p = n.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0,2).toUpperCase() : (p[0][0]+p[p.length-1][0]).toUpperCase();
};

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | student obj

  const load = async () => {
    setLoading(true);
    try {
      const data = await getStudents({ all: 'true' });
      setStudents(data);
    } catch { setStudents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.roomNo.toLowerCase().includes(q)
           || s.rollNo.toLowerCase().includes(q);
  });

  const handleSave = async (form) => {
    if (modal && modal._id) {
      await updateStudent(modal._id, form);
    } else {
      await createStudent(form);
    }
    setModal(null);
    load();
  };

  const handleDeactivate = async (id) => {
    await deactivateStudent(id);
    load();
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search by name or room..."
                 className="w-full pl-9 pr-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <Button variant="primary" size="sm" onClick={() => setModal('add')}>+ Add Student</Button>
      </div>

      {/* Table */}
      <Card padding="sm">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_,i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
                {filtered.map((s, i) => (
                  <tr key={s._id} className={i % 2 ? 'bg-slate-50/50' : ''}>
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getColor(s.name)}`}>
                          {initials(s.name)}
                        </div>
                        <span className="font-medium text-slate-800 truncate max-w-[140px]">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{s.rollNo}</td>
                    <td className="py-3 text-slate-600">{s.roomNo}</td>
                    <td className="py-3 text-slate-600 hidden md:table-cell">{s.department || '—'}</td>
                    <td className="py-3 hidden md:table-cell capitalize">{s.messPlan}</td>
                    <td className="py-3 hidden md:table-cell">₹{s.dailyRate}</td>
                    <td className="py-3">
                      <Badge variant={s.active ? 'present' : 'absent'}>
                        {s.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setModal(s)}>Edit</Button>
                        {s.active && (
                          <Button variant="danger" size="sm" onClick={() => handleDeactivate(s._id)}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {modal && (
        <StudentModal
          student={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
