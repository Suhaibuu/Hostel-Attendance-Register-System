import { useState } from 'react';
import { updateStudent } from '../../api/students';
import Spinner from '../ui/Spinner';
import { motion } from 'framer-motion';
import { Home, KeyRound, User, ChevronRight, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6 border border-slate-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4">
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-smooth cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Student metadata widget */}
        <div className="mb-5 p-4 bg-slate-50 border border-slate-200/40 rounded-2xl flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Assigning room to</p>
            <h4 className="font-bold text-slate-800 text-sm truncate">{student.name}</h4>
            <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">{student.rollNo} · {student.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-amber-50 rounded-xl">
            <Home className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Allot Room Block</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Room Tag / Label</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value.toUpperCase())}
                placeholder="A12"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-base font-black tracking-widest outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all uppercase"
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1.5 ml-1">{error}</p>}
          </div>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-smooth cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition-smooth cursor-pointer shadow-md shadow-amber-500/10 flex items-center justify-center gap-1"
            >
              {saving ? <Spinner size="sm" color="white" /> : <>Complete Allotment <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
