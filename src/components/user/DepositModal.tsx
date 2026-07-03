import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fmt } from '@/lib/format';
import { X, Loader2, CreditCard, Check } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

const amounts = [500, 1000, 2500, 5000, 10000, 25000];

const DepositModal: React.FC<Props> = ({ open, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const cents = custom ? Math.round(parseFloat(custom) * 100) : amount;

  const handleDeposit = async () => {
    if (!user || !cents) return;
    setLoading(true);

    // Simulate payment via FamousPay
    const paymentId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fee = Math.round(cents * 0.02);
    const newBalance = user.wallet_balance + cents;

    await supabase.from('dhru_users').update({ wallet_balance: newBalance }).eq('id', user.id);
    await supabase.from('dhru_transactions').insert({
      user_id: user.id, type: 'deposit', amount: cents,
      balance_after: newBalance,
      description: `FamousPay deposit (${paymentId}) · fee: ${fmt(fee)}`
    });

    await refreshUser();
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onClose(); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl p-6">
        {success ? (
          <div className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500 text-white mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">Deposit Successful!</h3>
            <p className="text-sm text-muted-foreground mt-1">{fmt(cents)} added to wallet.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Add Funds</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {amounts.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustom(''); }}
                  className={`py-3 rounded-xl text-sm font-bold transition border ${
                    amount === a && !custom
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-foreground'
                  }`}
                >
                  {fmt(a)}
                </button>
              ))}
            </div>

            <div className="relative mb-5">
              <span className="absolute left-3 top-3 text-muted-foreground font-medium">$</span>
              <input
                type="number" value={custom} onChange={(e) => setCustom(e.target.value)}
                placeholder="Custom amount" min="1" step="0.01"
                className="w-full pl-8 pr-3 py-3 bg-background border-2 border-border rounded-lg focus:border-foreground outline-none text-sm text-foreground"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Deposit</span><span className="font-semibold text-foreground">{fmt(cents)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span>Processing fee (2%)</span><span>{fmt(Math.round(cents * 0.02))}</span>
            </div>

            <button
              onClick={handleDeposit} disabled={loading || cents === 0}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Deposit · {fmt(cents)}
            </button>

            <div className="mt-4 text-center text-[10px] text-muted-foreground/60">
              Processed securely via Stripe / FamousPay · All funds are non-refundable
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepositModal;
