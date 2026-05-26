import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Loader2, Check, CreditCard } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

const STRIPE_ACCOUNT_ID = 'acct_1TaTdlHY8Hsni4Fd';
const stripePromise = loadStripe(
  'pk_live_51OJhJBHdGQpsHqInIzu7c6PzGPSH0yImD4xfpofvxvFZs0VFhPRXZCyEgYkkhOtBOXFWvssYASs851mflwQvjnrl00T6DbUwWZ',
  { stripeAccount: STRIPE_ACCOUNT_ID }
);

const PayForm: React.FC<{ amountCents: number; onSuccess: (pi: any) => void; onCancel: () => void }> = ({ amountCents, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setErr('');
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements, redirect: 'if_required'
    });
    if (error) { setErr(error.message || 'Payment failed'); setLoading(false); return; }
    if (paymentIntent?.status === 'succeeded') onSuccess(paymentIntent);
    else { setErr('Payment not completed'); setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement />
      {err && <div className="text-xs text-red-600 px-3 py-2 bg-red-50 rounded-lg">{err}</div>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className="py-3 rounded-xl border-2 border-black/10 font-semibold text-sm">Cancel</button>
        <button type="submit" disabled={!stripe || loading} className="py-3 rounded-xl bg-black text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Pay ${(amountCents/100).toFixed(2)}
        </button>
      </div>
    </form>
  );
};

const DepositModal: React.FC<Props> = ({ open, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('50');
  const [step, setStep] = useState<'amount' | 'pay' | 'done'>('amount');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('amount'); setClientSecret(''); setError(''); setAmount('50');
    }
  }, [open]);

  if (!open) return null;

  const quickAmounts = [10, 25, 50, 100, 250, 500];
  const cents = Math.round(parseFloat(amount || '0') * 100);

  const startPayment = async () => {
    if (!cents || cents < 100) { setError('Minimum deposit is $1.00'); return; }
    setLoading(true); setError('');
    const { data, error: fnErr } = await supabase.functions.invoke('create-payment-intent', {
      body: { amount: cents, currency: 'usd', metadata: { user_id: user?.id, purpose: 'wallet_deposit' } }
    });
    if (fnErr || !data?.clientSecret) {
      setError(data?.error || fnErr?.message || 'Unable to initialize payment');
      setLoading(false); return;
    }
    setClientSecret(data.clientSecret);
    setStep('pay');
    setLoading(false);
  };

  const handleSuccess = async (pi: any) => {
    if (!user) return;
    const newBalance = user.wallet_balance + cents;
    await supabase.from('dhru_users').update({ wallet_balance: newBalance }).eq('id', user.id);
    await supabase.from('dhru_transactions').insert({
      user_id: user.id, type: 'deposit', amount: cents,
      balance_after: newBalance,
      description: `Wallet deposit · ${pi.id}`
    });
    await refreshUser();
    setStep('done');
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        {step === 'done' ? (
          <div className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-black text-white mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">Deposit Successful</h3>
            <p className="text-sm text-black/60 mt-1">${(cents/100).toFixed(2)} added to your wallet</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{step === 'amount' ? 'Add Funds' : 'Card Details'}</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
            </div>

            {step === 'amount' && (
              <>
                <div className="text-3xl font-bold mb-4 flex items-center">
                  <span className="text-black/40 mr-1">$</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 outline-none border-b-2 border-black/10 focus:border-black pb-1" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {quickAmounts.map((a) => (
                    <button key={a} onClick={() => setAmount(String(a))} className={`py-2.5 rounded-lg border-2 text-sm font-semibold transition ${parseFloat(amount) === a ? 'border-black bg-black text-white' : 'border-black/10 hover:border-black/30'}`}>
                      ${a}
                    </button>
                  ))}
                </div>
                {error && <div className="text-xs text-red-600 mb-3 px-3 py-2 bg-red-50 rounded-lg">{error}</div>}
                <button onClick={startPayment} disabled={loading} className="w-full py-3 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Continue to Payment
                </button>
                <p className="text-xs text-black/50 text-center mt-3">Secured by FamousPay · Powered by Stripe</p>
              </>
            )}

            {step === 'pay' && clientSecret && (
              <>
                <div className="bg-black text-white rounded-xl p-3 mb-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-white/60">Depositing</span>
                  <span className="font-bold">${(cents/100).toFixed(2)}</span>
                </div>
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                  <PayForm amountCents={cents} onSuccess={handleSuccess} onCancel={() => setStep('amount')} />
                </Elements>
                <p className="text-xs text-black/50 text-center mt-3">Funds credit instantly upon successful payment</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DepositModal;
