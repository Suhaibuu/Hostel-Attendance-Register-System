import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function StudentModal({ student, onSave, onClose }) {
  const isEdit = !!student;
  const [form, setForm] = useState({
    name: student?.name || '',
    rollNo: student?.rollNo || '',
    roomNo: student?.roomNo || '',
    department: student?.department || '',
    messPlan: student?.messPlan || 'full',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.rollNo.trim()) e.rollNo = 'Roll No is required';
    if (!form.roomNo.trim()) e.roomNo = 'Room No is required';
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
            {[
              ['name', 'Name', 'text'],
              ['rollNo', 'Roll No', 'text'],
              ['roomNo', 'Room No', 'text'],
              ['department', 'Department', 'text'],
            ].map(([key, label, type]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)}
                       className={inputCls} disabled={isEdit && key === 'rollNo'} />
                {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mess Plan</label>
              <select value={form.messPlan} onChange={(e) => set('messPlan', e.target.value)}
                      className={inputCls}>
                <option value="full">Full</option>
                <option value="half">Half</option>
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
