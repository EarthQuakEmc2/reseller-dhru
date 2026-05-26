import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fmt, fmtDate } from '@/lib/format';
import { ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

const WalletHistory: React.FC = () => {
  const { user } = useAuth();
  const [tx, setTx] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('dhru_transactions').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setTx(data || []));
  }, [user]);

  return (
    <div className="px-4 pb-24">
      <h2 className="text-lg font-bold mb-3 mt-2">Transaction History</h2>
      {tx.length === 0 ? (
        <div className="text-center py-20 text-sm text-black/40">No transactions yet</div>
      ) : (
        <div className="space-y-2">
          {tx.map((t) => {
            const isCredit = t.amount > 0;
            const Icon = t.type === 'refund' ? RotateCcw : isCredit ? ArrowDownLeft : ArrowUpRight;
            return (
              <div key={t.id} className="bg-white border border-black/10 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isCredit ? 'bg-black text-white' : 'bg-black/5 text-black'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{t.description}</div>
                  <div className="text-xs text-black/50">{fmtDate(t.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${isCredit ? 'text-green-700' : ''}`}>
                    {isCredit ? '+' : ''}{fmt(t.amount)}
                  </div>
                  <div className="text-xs text-black/40">Bal: {fmt(t.balance_after)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WalletHistory;
