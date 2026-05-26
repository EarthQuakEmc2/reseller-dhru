import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmt, fmtDate } from '@/lib/format';

const AdminRefunds: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    supabase.from('dhru_refunds').select('*').order('created_at', { ascending: false }).then(({ data }) => setRefunds(data || []));
    supabase.from('dhru_users').select('id, email, name').then(({ data }) => {
      const m: Record<string, any> = {};
      data?.forEach((u) => m[u.id] = u);
      setUsers(m);
    });
  }, []);

  const total = refunds.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card label="Total Refunds" value={refunds.length.toString()} />
        <Card label="Total Amount" value={fmt(total)} />
        <Card label="This Month" value={refunds.filter((r) => new Date(r.created_at).getMonth() === new Date().getMonth()).length.toString()} />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Reason</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="p-3">{users[r.user_id]?.email || 'Unknown'}</td>
                <td className="p-3 text-white/60 text-xs">{r.reason}</td>
                <td className="p-3 text-right font-bold">{fmt(r.amount)}</td>
                <td className="p-3 text-xs text-white/60">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
            {refunds.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-white/40">No refunds yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Card: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);

export default AdminRefunds;
