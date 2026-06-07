import { useState } from 'react';
import { updateStudent } from '../../api/students';
import Button from '../ui/Button';

export default function AssignRoomModal({ student, onSave, onClose }) {
  const [roomNo, setRoomNo] = useState(student.roomNo || '');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomNo.trim()) { setError('Room number is required'); return; }
    setSaving(true);
    try {
      await updateStudent(student._id, { roomNo: roomNo.trim().toUpperCase() });
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to assign room');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Student info */}
        <div className="mb-5 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 mb-0.5">Assigning room to</p>
          <p className="font-bold text-slate-800">{student.name}</p>
          <p className="text-sm text-slate-500">{student.rollNo} · {student.department}</p>
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-4">Assign Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
            <input
              type="text"
              value={roomNo}
              onChange={(e) => setRoomNo(e.target.value.toUpperCase())}
              placeholder="e.g. A12 or 204"
              autoFocus
              className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase font-mono text-lg tracking-widest"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} fullWidth type="button">Cancel</Button>
            <Button variant="primary" fullWidth type="submit" loading={saving}>Assign Room</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
