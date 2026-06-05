import { useState } from 'react';
import { getReport } from '../../api/attendance';
import Card from '../ui/Card';
import Button from '../ui/Button';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

const downloadCSV = (data, month) => {
  const header = 'Room No,Name,Roll No,Days Present,Daily Rate,Bill Amount';
  const rows = data.map((r) =>
    [r.roomNo, r.name, r.rollNo, r.presentDays, r.dailyRate, r.bill].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hostel-bills-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function BillsTab() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await getReport(month)); }
    catch { setData([]); }
    finally { setLoading(false); }
  };

  const totalBill = data.reduce((s, r) => s + r.bill, 0);
  const avgBill = data.length ? Math.round(totalBill / data.length) : 0;

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Print-only style */}
      <style>{`@media print { body * { visibility: hidden; } #bills-print, #bills-print * { visibility: visible; } #bills-print { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>

      <div className="flex flex-wrap gap-3 items-center">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
               className="border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <Button variant="primary" size="sm" onClick={load} loading={loading}>Generate Bills</Button>
        {data.length > 0 && (
          <>
            <Button variant="ghost" size="sm" onClick={() => downloadCSV(data, month)}>📥 Download CSV</Button>
            <Button variant="ghost" size="sm" onClick={handlePrint}>🖨️ Download PDF</Button>
          </>
        )}
      </div>

      {data.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ['👥', 'Total Students', data.length],
              ['💰', 'Total Bill', fmt(totalBill)],
              ['📊', 'Avg Bill', fmt(avgBill)],
            ].map(([icon, label, val]) => (
              <Card padding="sm" key={label}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-lg font-bold text-slate-800">{val}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Table */}
          <div id="bills-print">
            <Card padding="sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-[var(--color-border)]">
                      <th className="pb-3 pl-3">Room</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Roll No</th>
                      <th className="pb-3">Days Present</th>
                      <th className="pb-3">Daily Rate</th>
                      <th className="pb-3 pr-3 text-right">Bill Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={r.studentId} className={i % 2 ? 'bg-slate-50/50' : ''}>
                        <td className="py-3 pl-3 text-slate-600">{r.roomNo}</td>
                        <td className="py-3 font-medium text-slate-800">{r.name}</td>
                        <td className="py-3 text-slate-600">{r.rollNo}</td>
                        <td className="py-3 text-slate-600">{r.presentDays}</td>
                        <td className="py-3 text-slate-600">{fmt(r.dailyRate)}</td>
                        <td className="py-3 pr-3 text-right font-bold text-[var(--color-primary)]">
                          {fmt(r.bill)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 font-bold border-t border-[var(--color-border)]">
                      <td className="py-3 pl-3" colSpan={5}>Total</td>
                      <td className="py-3 pr-3 text-right text-[var(--color-primary)]">{fmt(totalBill)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      {!loading && data.length === 0 && (
        <Card><p className="text-center text-sm text-slate-400 py-8">Select a month and generate bills</p></Card>
      )}
    </div>
  );
}
