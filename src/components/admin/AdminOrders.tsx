import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmt, fmtDate } from '@/lib/format';
import { RefreshCw, RotateCcw, Check, X, FileText } from 'lucide-react';

const statusOptions = ['pending', 'processing', 'completed', 'rejected', 'refunded'];

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState('all');
  const [refundOrder, setRefundOrder] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');

  const load = async () => {
    const { data: ordersData } = await supabase.from('dhru_orders').select('*').order('created_at', { ascending: false }).limit(200);
    const { data: usersData } = await supabase.from('dhru_users').select('id, email, name, wallet_balance');
    const userMap: Record<string, any> = {};
    usersData?.forEach((u) => userMap[u.id] = u);
    setUsers(userMap);
    setOrders(ordersData || []);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string, delivery_info?: string) => {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (delivery_info !== undefined) updates.delivery_info = delivery_info;
    await supabase.from('dhru_orders').update(updates).eq('id', id);
    load();
  };

  const setDelivery = async (order: any) => {
    const v = prompt('Enter delivery info / unlock code / result:', order.delivery_info || '');
    if (v !== null) await updateStatus(order.id, 'completed', v);
  };

  const processRefund = async () => {
    if (!refundOrder) return;
    const user = users[refundOrder.user_id];
    if (!user) return;
    const newBalance = user.wallet_balance + refundOrder.amount;
    await supabase.from('dhru_users').update({ wallet_balance: newBalance }).eq('id', user.id);
    await supabase.from('dhru_transactions').insert({
      user_id: user.id, type: 'refund', amount: refundOrder.amount,
      balance_after: newBalance, description: `Refund: ${refundOrder.product_name}`,
      reference_id: refundOrder.id
    });
    await supabase.from('dhru_orders').update({ status: 'refunded', updated_at: new Date().toISOString() }).eq('id', refundOrder.id);
    await supabase.from('dhru_refunds').insert({
      order_id: refundOrder.id, user_id: user.id, amount: refundOrder.amount,
      reason: refundReason || 'Admin refund', status: 'completed'
    });
    setRefundOrder(null);
    setRefundReason('');
    load();
  };

  const generateInvoice = async (order: any) => {
    const user = users[order.user_id];
    const invoiceNumber = `INV-${Date.now()}`;
    await supabase.from('dhru_invoices').insert({
      invoice_number: invoiceNumber, user_id: order.user_id, order_id: order.id,
      amount: order.amount, description: order.product_name, status: 'paid'
    });

    // Open printable invoice
    const html = `
      <html><head><title>${invoiceNumber}</title>
      <style>body{font-family:system-ui;padding:40px;max-width:600px;margin:auto;}
      h1{border-bottom:2px solid #000;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      td,th{padding:8px;text-align:left;border-bottom:1px solid #eee}
      .total{font-size:1.5em;font-weight:bold;text-align:right;padding-top:20px}</style>
      </head><body>
      <h1>INVOICE ${invoiceNumber}</h1>
      <p><strong>Bill to:</strong> ${user?.name || ''} (${user?.email || ''})</p>
      <p><strong>Date:</strong> ${fmtDate(order.created_at)}</p>
      <p><strong>Status:</strong> PAID</p>
      <table><tr><th>Service</th><th>Type</th><th>Amount</th></tr>
      <tr><td>${order.product_name}</td><td>${order.service_type}</td><td>${fmt(order.amount)}</td></tr>
      </table>
      <div class="total">Total: ${fmt(order.amount)}</div>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none">
          <option value="all" className="bg-background text-foreground">All Orders</option>
          {statusOptions.map((s) => <option key={s} value={s} className="bg-background text-foreground">{s}</option>)}
        </select>
        <button onClick={load} className="px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-sm flex items-center gap-2 hover:bg-secondary/80">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        <span className="text-xs text-muted-foreground">{filtered.length} orders</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs uppercase sticky top-0 backdrop-blur">
              <tr>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Service</th>
                <th className="text-left p-3 hidden md:table-cell">Input</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const user = users[o.user_id];
                return (
                  <tr key={o.id} className="border-t border-border/50 hover:bg-secondary/50">
                    <td className="p-3">
                      <div className="font-semibold">{user?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{o.product_name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{o.service_type} · {fmtDate(o.created_at)}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-xs font-mono text-muted-foreground">{o.input_value}</td>
                    <td className="p-3">
                      <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="bg-secondary border border-border rounded px-2 py-1 text-xs uppercase">
                        {statusOptions.map((s) => <option key={s} value={s} className="bg-background text-foreground">{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-right font-bold">{fmt(o.amount)}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => setDelivery(o)} className="p-1.5 rounded hover:bg-secondary" title="Set delivery"><Check className="w-4 h-4" /></button>
                        <button onClick={() => generateInvoice(o)} className="p-1.5 rounded hover:bg-secondary" title="Invoice"><FileText className="w-4 h-4" /></button>
                        {o.status !== 'refunded' && (
                          <button onClick={() => setRefundOrder(o)} className="p-1.5 rounded hover:bg-secondary text-yellow-300" title="Refund"><RotateCcw className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No orders</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setRefundOrder(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2"><RotateCcw className="w-5 h-5" /> Refund Customer</h3>
              <button onClick={() => setRefundOrder(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-secondary border border-border rounded-lg p-3 mb-4 text-sm">
              <div className="text-xs text-muted-foreground">Refund to {users[refundOrder.user_id]?.email}</div>
              <div className="font-semibold mt-1">{refundOrder.product_name}</div>
              <div className="text-2xl font-bold mt-2">{fmt(refundOrder.amount)}</div>
            </div>
            <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wide">Reason</label>
            <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={3} placeholder="e.g. Service not delivered..." className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-foreground text-foreground text-sm mb-4" />
            <button onClick={processRefund} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold">
              Confirm Refund · {fmt(refundOrder.amount)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
