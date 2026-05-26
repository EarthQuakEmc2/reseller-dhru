import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fmt, fmtDate } from '@/lib/format';
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, Key } from 'lucide-react';

const WalletHistory: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [passwordSent, setPasswordSent] = useState(false);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('dhru_transactions')
      .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const requestPasswordReset = async () => {
    if (!user || resetting) return;
    setResetting(true);
    await supabase.from('dhru_password_resets').insert({
      user_id: user.id, status: 'pending'
    });
    setPasswordSent(true);
    setResetting(false);
  };

  return (
    <div className="px-4 pb-24">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-lg font-bold">Wallet History</h2>
        <div className="flex items-center gap-2">
          <button onClick={requestPasswordReset} disabled={passwordSent} className="p-2 rounded-lg hover:bg-secondary" title="Request Password Reset">
            <Key className={`w-4 h-4 ${passwordSent ? 'text-green-500' : ''}`} />
          </button>
          <button onClick={fetch} className="p-2 rounded-lg hover:bg-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {passwordSent && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs mb-3">
          Password reset request sent. An admin will process it soon.
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase">Current Balance</div>
            <div className="text-2xl font-bold">{fmt(user?.wallet_balance || 0)}</div>
          </div>
          <Wallet className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        {transactions.map((t) => {
          const isPositive = t.amount > 0;
          return (
            <div key={t.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold capitalize">{t.type.replace('_', ' ')}</div>
                <div className="text-xs text-muted-foreground truncate">{t.description}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{fmt(t.amount)}
                </div>
                <div className="text-[10px] text-muted-foreground">{fmtDate(t.created_at)}</div>
              </div>
            </div>
          );
        })}
        {transactions.length === 0 && !loading && (
          <div className="text-center py-16 text-sm text-muted-foreground">No transactions yet</div>
        )}
      </div>
    </div>
  );
};

export default WalletHistory;
