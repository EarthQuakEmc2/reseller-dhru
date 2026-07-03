import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmt } from '@/lib/format';
import { Search, Edit3, X, Save, EyeOff, Eye } from 'lucide-react';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    let q = supabase.from('dhru_products').select('*').order('service_type').order('category_name').order('name');
    const { data } = await q;
    setProducts(data || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) => {
    if (type !== 'all' && p.service_type !== type) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const startEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name,
      custom_description: p.custom_description || '',
      custom_price: p.custom_price ? (p.custom_price / 100).toFixed(2) : '',
      image_url: p.image_url || '',
      active: p.active,
    });
  };

  const save = async () => {
    if (!editing) return;
    await supabase.from('dhru_products').update({
      name: form.name,
      custom_description: form.custom_description || null,
      custom_price: form.custom_price ? Math.round(parseFloat(form.custom_price) * 100) : null,
      image_url: form.image_url || null,
      active: form.active,
      updated_at: new Date().toISOString()
    }).eq('id', editing.id);
    setEditing(null);
    load();
  };

  const toggleActive = async (p: any) => {
    await supabase.from('dhru_products').update({ active: !p.active }).eq('id', p.id);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none focus:border-foreground"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none">
          <option value="all" className="bg-background text-foreground">All Types</option>
          <option value="imei" className="bg-background text-foreground">IMEI</option>
          <option value="server" className="bg-background text-foreground">Server</option>
          <option value="remote" className="bg-background text-foreground">Remote</option>
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} items</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs uppercase tracking-wider sticky top-0 backdrop-blur">
              <tr>
                <th className="text-left p-3">Service</th>
                <th className="text-left p-3 hidden md:table-cell">Category</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Price</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border/50 hover:bg-secondary/50">
                  <td className="p-3">
                    <div className={`font-semibold ${!p.active ? 'opacity-40' : ''}`}>{p.name}</div>
                    {p.delivery_time && <div className="text-xs text-muted-foreground">{p.delivery_time}</div>}
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">{p.category_name}</td>
                  <td className="p-3"><span className="text-xs uppercase px-2 py-0.5 bg-secondary rounded">{p.service_type}</span></td>
                  <td className="p-3 text-right font-bold">
                    {p.custom_price ? <><span className="line-through text-foreground/30 mr-2 text-xs">{fmt(p.price)}</span>{fmt(p.custom_price)}</> : fmt(p.price)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => toggleActive(p)} className="p-1.5 rounded hover:bg-secondary" title={p.active ? 'Hide' : 'Show'}>
                        {p.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-50" />}
                      </button>
                      <button onClick={() => startEdit(p)} className="p-1.5 rounded hover:bg-secondary">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No products. Sync from terminal.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Edit Product</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <Field label="Name" value={form.name} onChange={(v) => setForm({...form, name: v})} />
              <Field label="Custom Description" value={form.custom_description} onChange={(v) => setForm({...form, custom_description: v})} textarea />
              <Field label={`Custom Price (USD) — original: ${fmt(editing.price)}`} value={form.custom_price} onChange={(v) => setForm({...form, custom_price: v})} placeholder="e.g. 19.99" />
              <Field label="Image URL" value={form.image_url} onChange={(v) => setForm({...form, image_url: v})} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} />
                <span>Active (visible to users)</span>
              </label>
              <button onClick={save} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; textarea?: boolean; placeholder?: string }> = ({ label, value, onChange, textarea, placeholder }) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wide">{label}</label>
    {textarea ? (
      <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-foreground text-foreground" />
    ) : (
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-foreground text-foreground" />
    )}
  </div>
);

export default AdminProducts;
