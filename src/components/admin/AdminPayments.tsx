import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmt, fmtDate } from '@/lib/format';
import { CreditCard, RefreshCw, TrendingUp, Users } from 'lucide-react';

const AdminPayments: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: tx } = await supabase.from('dhru_transactions').select('*').eq('type', 'deposit').order('created_at', { ascending: false }).limit(200);
    const { data: usrs } = await supabase.from('dhru_users').select('id, email, name');
    const map: Record<string, any> = {};
    usrs?.forEach((u) => map[u.id] = u);
    setUsers(map);
    setDeposits(tx || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const total = deposits.reduce((s, d) => s + d.amount, 0);
  const today = deposits.filter((d) => new Date(d.created_at).toDateString() === new Date().toDateString());
  const todayTotal = today.reduce((s, d) => s + d.amount, 0);
  const uniqueDepositors = new Set(deposits.map((d) => d.user_id)).size;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={CreditCard} label="Total Deposits" value={fmt(total)} highlight />
        <Stat icon={TrendingUp} label="Today" value={fmt(todayTotal)} />
        <Stat icon={CreditCard} label="Transactions" value={deposits.length.toString()} />
        <Stat icon={Users} label="Depositors" value={uniqueDepositors.toString()} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-bold">Recent Payments</h3>
        <button onClick={load} className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm flex items-center gap-2 hover:bg-secondary/80">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs uppercase sticky top-0 backdrop-blur">
              <tr>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3 hidden md:table-cell">Description</th>
                <th className="text-left p-3">Date</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-right p-3 hidden md:table-cell">Balance After</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => {
                const u = users[d.user_id];
                return (
                  <tr key={d.id} className="border-t border-border/50 hover:bg-secondary/50">
                    <td className="p-3">
                      <div className="font-semibold">{u?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{u?.email}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-xs text-muted-foreground font-mono truncate max-w-xs">{d.description}</td>
                    <td className="p-3 text-xs text-muted-foreground">{fmtDate(d.created_at)}</td>
                    <td className="p-3 text-right font-bold text-green-400">+{fmt(d.amount)}</td>
                    <td className="p-3 text-right hidden md:table-cell text-muted-foreground">{fmt(d.balance_after)}</td>
                  </tr>
                );
              })}
              {deposits.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No payments yet. Deposits will appear here once customers add funds.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">FamousPay Integration:</strong> All deposits are processed through Stripe via the FamousPay gateway with a 2% platform fee. Funds are credited to user wallets only after successful payment confirmation. Payment IDs are stored in the transaction description for reconciliation.
      </div>
    </div>
  );
};

const Stat: React.FC<{ icon: any; label: string; value: string; highlight?: boolean }> = ({ icon: Icon, label, value, highlight }) => (
  <div className={`${highlight ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'} rounded-xl p-4`}>
    <Icon className={`w-5 h-5 ${highlight ? 'text-primary-foreground/60' : 'text-muted-foreground'} mb-2`} />
    <div className={`text-xs ${highlight ? 'text-primary-foreground/60' : 'text-muted-foreground'} uppercase tracking-wider`}>{label}</div>
    <div className="text-xl font-bold mt-1">{value}</div>
  </div>
);

export default AdminPayments;
