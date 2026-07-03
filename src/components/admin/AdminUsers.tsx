import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmt, fmtDate } from '@/lib/format';
import { Key, Plus, Search, Minus, X, RefreshCw } from 'lucide-react';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [resets, setResets] = useState<any[]>([]);
  const [adjustUser, setAdjustUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const load = async () => {
    const { data } = await supabase.from('dhru_users').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    const { data: r } = await supabase.from('dhru_password_resets').select('*').eq('status', 'pending');
    setResets(r || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()));

  const resetPassword = async (u: any) => {
    const np = prompt(`Set new password for ${u.email}:`, 'newpass123');
    if (!np) return;
    await supabase.from('dhru_users').update({ password_hash: np }).eq('id', u.id);
    // mark any pending resets as completed
    await supabase.from('dhru_password_resets').update({ status: 'completed', new_password_hash: np }).eq('user_id', u.id).eq('status', 'pending');
    alert(`Password reset for ${u.email}. New password: ${np}`);
    load();
  };

  const toggleAdmin = async (u: any) => {
    await supabase.from('dhru_users').update({ role: u.role === 'admin' ? 'user' : 'admin' }).eq('id', u.id);
    load();
  };

  const adjust = async (delta: number) => {
    if (!adjustUser) return;
    const cents = Math.round(parseFloat(adjustAmount) * 100) * (delta > 0 ? 1 : -1);
    if (!cents) return;
    const newBalance = Math.max(0, adjustUser.wallet_balance + cents);
    await supabase.from('dhru_users').update({ wallet_balance: newBalance }).eq('id', adjustUser.id);
    await supabase.from('dhru_transactions').insert({
      user_id: adjustUser.id, type: cents > 0 ? 'admin_credit' : 'admin_debit',
      amount: cents, balance_after: newBalance,
      description: adjustNote || (cents > 0 ? 'Admin credit' : 'Admin debit')
    });
    setAdjustUser(null); setAdjustAmount(''); setAdjustNote('');
    load();
  };

  return (
    <div className="space-y-3">
      {resets.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
          <div className="font-semibold text-yellow-200 mb-2">{resets.length} pending password reset request(s)</div>
          <div className="space-y-1">
            {resets.map((r) => {
              const user = users.find((u) => u.id === r.user_id);
              return (
                <div key={r.id} className="flex items-center justify-between gap-2">
                  <span className="text-foreground/80">{user?.email} · {fmtDate(r.created_at)}</span>
                  <button onClick={() => user && resetPassword(user)} className="text-xs px-2 py-1 bg-yellow-500 text-black rounded font-semibold">Process</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none focus:border-foreground" />
        </div>
        <button onClick={load} className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm flex items-center gap-2 hover:bg-secondary/80">
          <RefreshCw className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground">{filtered.length} users</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs uppercase sticky top-0 backdrop-blur">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3 hidden md:table-cell">Phone</th>
                <th className="text-left p-3">Role</th>
                <th className="text-right p-3">Balance</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border/50 hover:bg-secondary/50">
                  <td className="p-3">
                    <div className="font-semibold">{u.name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">{u.phone || '—'}</td>
                  <td className="p-3">
                    <button onClick={() => toggleAdmin(u)} className={`text-xs px-2 py-0.5 rounded uppercase font-semibold ${u.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {u.role}
                    </button>
                  </td>
                  <td className="p-3 text-right font-bold">{fmt(u.wallet_balance)}</td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => { setAdjustUser(u); setAdjustAmount('10'); }} className="p-1.5 rounded hover:bg-secondary" title="Adjust balance">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => resetPassword(u)} className="p-1.5 rounded hover:bg-secondary" title="Reset password">
                        <Key className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adjustUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setAdjustUser(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Adjust Balance · {adjustUser.email}</h3>
              <button onClick={() => setAdjustUser(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="text-2xl font-bold mb-3">Current: {fmt(adjustUser.wallet_balance)}</div>
            <label className="block text-xs text-muted-foreground mb-1 uppercase">Amount (USD)</label>
            <input value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none mb-3" />
            <label className="block text-xs text-muted-foreground mb-1 uppercase">Note</label>
            <input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="Reason..." className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none mb-4" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => adjust(-1)} className="py-3 border border-border rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-secondary">
                <Minus className="w-4 h-4" /> Deduct
              </button>
              <button onClick={() => adjust(1)} className="py-3 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
