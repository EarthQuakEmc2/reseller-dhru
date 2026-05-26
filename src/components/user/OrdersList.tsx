import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fmt, fmtDate } from '@/lib/format';
import { Package, RefreshCw } from 'lucide-react';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  processing: 'bg-blue-100 text-blue-900 border-blue-300',
  completed: 'bg-green-100 text-green-900 border-green-300',
  rejected: 'bg-red-100 text-red-900 border-red-300',
  refunded: 'bg-gray-100 text-gray-900 border-gray-300',
};

const OrdersList: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('dhru_orders')
      .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  return (
    <div className="px-4 pb-24">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-lg font-bold">My Orders</h2>
        <button onClick={fetch} className="p-2 rounded-lg hover:bg-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <div className="text-sm text-muted-foreground">No orders yet</div>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm leading-tight">{o.product_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{fmtDate(o.created_at)}</div>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-md border font-semibold uppercase ${statusStyles[o.status] || 'bg-secondary'}`}>
                  {o.status}
                </span>
              </div>
              {o.input_value && (
                <div className="text-xs font-mono bg-secondary rounded px-2 py-1 mb-2 truncate">{o.input_value}</div>
              )}
              {o.delivery_info && (
                <div className="text-xs bg-green-50 border border-green-200 rounded px-2 py-2 mb-2">
                  <div className="text-[10px] uppercase font-bold text-green-700 mb-0.5">Result</div>
                  <div className="font-mono break-all">{o.delivery_info}</div>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground uppercase">{o.service_type}</span>
                <span className="font-bold">{fmt(o.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;
