import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fmt } from '@/lib/format';
import { X, Loader2, Check } from 'lucide-react';

interface Props { product: any; onClose: () => void; }

const OrderModal: React.FC<Props> = ({ product, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const price = product.custom_price ?? product.price;
  const insufficient = !user || user.wallet_balance < price;

  const inputLabel =
    product.service_type === 'imei' ? 'IMEI / Serial Number' :
    product.service_type === 'server' ? 'IMEI / Identifier' : 'Device Info / Request Details';

  const handleSubmit = async () => {
    if (!user) return;
    if (!input.trim()) { setError('This field is required'); return; }
    if (insufficient) { setError('Insufficient balance. Please deposit funds.'); return; }
    setLoading(true);
    setError('');

    // Deduct balance
    const newBalance = user.wallet_balance - price;
    await supabase.from('dhru_users').update({ wallet_balance: newBalance }).eq('id', user.id);

    // Create order
    const { data: order } = await supabase.from('dhru_orders').insert({
      user_id: user.id,
      product_id: product.id,
      product_name: product.name,
      service_type: product.service_type,
      status: 'pending',
      input_value: input.trim(),
      amount: price,
    }).select().single();

    // Transaction record
    await supabase.from('dhru_transactions').insert({
      user_id: user.id, type: 'order', amount: -price,
      balance_after: newBalance, description: `Order: ${product.name}`,
      reference_id: order?.id
    });

    // Try to submit to DHRU
    try {
      const { data: dhruRes } = await supabase.functions.invoke('dhru-api', {
        body: {
          action: 'place-order',
          service_id: product.dhru_id,
          service_type: product.service_type,
          input_value: input.trim()
        }
      });
      if (order && dhruRes) {
        let dhruOrderId = null;
        if (dhruRes.data?.SUCCESS?.[0]?.REFERENCEID) dhruOrderId = dhruRes.data.SUCCESS[0].REFERENCEID;
        await supabase.from('dhru_orders').update({
          response_data: dhruRes, dhru_order_id: dhruOrderId,
          status: dhruRes.ok ? 'processing' : 'pending'
        }).eq('id', order.id);
      }
    } catch (e) {
      console.error(e);
    }

    await refreshUser();
    setLoading(false);
    setSuccess(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-black text-white mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">Order Placed!</h3>
            <p className="text-sm text-black/60 mt-1">Your order has been submitted to the server.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Place Order</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black text-white rounded-xl p-4 mb-4">
              <div className="text-xs text-white/60 uppercase tracking-wide mb-1">{product.service_type} Service</div>
              <div className="font-semibold text-sm">{product.name}</div>
              {product.category_name && <div className="text-xs text-white/50 mt-1">{product.category_name}</div>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-white/60">Total</div>
                <div className="text-xl font-bold">{fmt(price)}</div>
              </div>
            </div>

            {(product.custom_description || product.description) && (
              <div className="text-xs text-black/60 mb-4 p-3 bg-black/5 rounded-lg">
                {product.custom_description || product.description}
              </div>
            )}

            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide">{inputLabel}</label>
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Enter value..."
              className="w-full px-3 py-3 border-2 border-black/10 rounded-lg focus:border-black outline-none text-sm font-mono"
            />

            <div className="flex items-center justify-between mt-4 text-xs">
              <span className="text-black/60">Your balance</span>
              <span className={`font-semibold ${insufficient ? 'text-red-600' : ''}`}>{fmt(user?.wallet_balance || 0)}</span>
            </div>

            {error && <div className="text-xs text-red-600 mt-2 px-3 py-2 bg-red-50 rounded-lg">{error}</div>}

            <button
              onClick={handleSubmit} disabled={loading || insufficient}
              className="w-full mt-4 py-3 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {insufficient ? 'Insufficient Balance' : `Place Order · ${fmt(price)}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderModal;
