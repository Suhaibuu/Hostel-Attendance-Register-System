import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

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
    'w-full border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card padding="lg">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            {isEdit ? 'Edit Student' : 'Add Student'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                     className={inputCls} required />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Roll No</label>
              <input type="text" value={form.rollNo} onChange={(e) => set('rollNo', e.target.value.toUpperCase())}
                     className={`${inputCls} uppercase`} disabled={isEdit} required />
              {errors.rollNo && <p className="text-xs text-red-500 mt-1">{errors.rollNo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room No (Optional)</label>
              <input type="text" value={form.roomNo} onChange={(e) => set('roomNo', e.target.value)}
                     className={inputCls} />
              {errors.roomNo && <p className="text-xs text-red-500 mt-1">{errors.roomNo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)}
                      className={inputCls}>
                <option value="Computer Science (CSE)">Computer Science (CSE)</option>
                <option value="Electronics and Communication(ECE)">Electronics and Communication(ECE)</option>
                <option value="Mechanical(ME)">Mechanical(ME)</option>
                <option value="Electrical and Electronics(EEE)">Electrical and Electronics(EEE)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Program Level</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)}
                      className={inputCls}>
                <option value="UG">Undergraduate (UG)</option>
                <option value="PG">Postgraduate (PG)</option>
              </select>
            </div>

            {errors._form && (
              <p className="text-sm text-red-500 text-center">{errors._form}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} fullWidth type="button">Cancel</Button>
              <Button variant="primary" fullWidth type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
