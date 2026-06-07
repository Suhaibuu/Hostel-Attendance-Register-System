import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { motion } from 'framer-motion';
import { Plus, Edit3, User, UserPlus, MapPin, BookOpen, Layers } from 'lucide-react';

export default function StudentModal({ student, onSave, onClose }) {
  const isEdit = !!student;
  const [form, setForm] = useState({
    name: student?.name || '',
    rollNo: student?.rollNo || '',
    roomNo: student?.roomNo || '',
    department: student?.department || 'Computer Science (CSE)',
    level: student?.level || 'UG',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.rollNo.trim()) e.rollNo = 'Roll No is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
    } catch {
      setErrors({ _form: 'Failed to save. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all font-semibold text-slate-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-6 border border-slate-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 bg-indigo-50 rounded-2xl">
            {isEdit ? <Edit3 className="w-5 h-5 text-indigo-600" /> : <UserPlus className="w-5 h-5 text-indigo-600" />}
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Modify Resident Details' : 'Allot New Resident'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Full Name</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => set('name', e.target.value)}
              className={inputCls} 
              placeholder="Aditya Nair"
              required 
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Roll Number (Unique ID)</label>
            <input 
              type="text" 
              value={form.rollNo} 
              onChange={(e) => set('rollNo', e.target.value.toUpperCase())}
              className={`${inputCls} uppercase`} 
              disabled={isEdit} 
              placeholder="CST221"
              required 
            />
            {errors.rollNo && <p className="text-xs text-red-500 mt-1">{errors.rollNo}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Room No</label>
              <input 
                type="text" 
                value={form.roomNo} 
                onChange={(e) => set('roomNo', e.target.value)}
                placeholder="101"
                className={inputCls} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Program Level</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)} className={inputCls}>
                <option value="UG">UG (B.Tech)</option>
                <option value="PG">PG (M.Tech)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Academic Branch</label>
            <select value={form.department} onChange={(e) => set('department', e.target.value)} className={inputCls}>
              <option value="Computer Science (CSE)">Computer Science (CSE)</option>
              <option value="Electronics and Communication(ECE)">Electronics and Communication(ECE)</option>
              <option value="Mechanical(ME)">Mechanical (ME)</option>
              <option value="Electrical and Electronics(EEE)">Electrical and Electronics(EEE)</option>
            </select>
          </div>

          {errors._form && (
            <p className="text-xs text-red-500 text-center font-semibold">{errors._form}</p>
          )}

          <div className="flex gap-2 pt-2">
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
              className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-smooth cursor-pointer shadow-glow flex items-center justify-center gap-1.5"
            >
              {saving ? <Spinner size="sm" color="white" /> : 'Apply Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
