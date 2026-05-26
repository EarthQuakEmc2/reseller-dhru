import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmt } from '@/lib/format';
import { Package, Users, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, revenue: 0, today: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ count: products }, { count: users }, { data: orders }] = await Promise.all([
      supabase.from('dhru_products').select('*', { count: 'exact', head: true }),
      supabase.from('dhru_users').select('*', { count: 'exact', head: true }),
      supabase.from('dhru_orders').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    const { data: allOrders } = await supabase.from('dhru_orders').select('amount, created_at, status');
    const revenue = (allOrders || []).filter((o) => o.status !== 'refunded' && o.status !== 'rejected').reduce((s, o) => s + o.amount, 0);
    const today = (allOrders || []).filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
    setStats({ products: products || 0, users: users || 0, orders: allOrders?.length || 0, revenue, today });
    setRecent(orders || []);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={Package} label="Products" value={stats.products.toString()} />
        <Stat icon={Users} label="Users" value={stats.users.toString()} />
        <Stat icon={ShoppingBag} label="Orders" value={stats.orders.toString()} />
        <Stat icon={TrendingUp} label="Today" value={stats.today.toString()} />
        <Stat icon={DollarSign} label="Revenue" value={fmt(stats.revenue)} highlight />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="font-bold mb-3">Recent Orders</h3>
        <div className="space-y-2">
          {recent.map((o) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{o.product_name}</div>
                <div className="text-xs text-white/40 uppercase">{o.service_type} · {o.status}</div>
              </div>
              <div className="font-bold">{fmt(o.amount)}</div>
            </div>
          ))}
          {recent.length === 0 && <div className="text-center text-white/40 py-8 text-sm">No orders yet</div>}
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ icon: any; label: string; value: string; highlight?: boolean }> = ({ icon: Icon, label, value, highlight }) => (
  <div className={`${highlight ? 'bg-white text-black' : 'bg-white/5 border border-white/10'} rounded-xl p-4`}>
    <Icon className={`w-5 h-5 ${highlight ? 'text-black/60' : 'text-white/60'} mb-2`} />
    <div className={`text-xs ${highlight ? 'text-black/60' : 'text-white/50'} uppercase tracking-wider`}>{label}</div>
    <div className="text-xl font-bold mt-1">{value}</div>
  </div>
);

export default AdminDashboard;
