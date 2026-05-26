import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ProductCard from './ProductCard';
import OrderModal from './OrderModal';
import { Search, Package } from 'lucide-react';

interface Props { serviceType: 'imei' | 'server' | 'remote'; }

const ServicesList: React.FC<Props> = ({ serviceType }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, [serviceType]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('dhru_products')
      .select('*')
      .eq('service_type', serviceType)
      .eq('active', true)
      .order('category_name', { ascending: true })
      .order('name', { ascending: true });
    setProducts(data || []);
    setLoading(false);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category_name && set.add(p.category_name));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category_name !== selectedCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, selectedCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    filtered.forEach((p) => {
      const key = p.category_name || 'Uncategorized';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filtered]);

  return (
    <div className="px-4 pb-24">
      <div className="sticky top-0 bg-background z-10 pt-2 pb-3 -mx-4 px-4 border-b border-border/50">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${serviceType} services...`}
            className="w-full pl-9 pr-3 py-2.5 bg-card rounded-lg text-sm text-foreground outline-none focus:bg-secondary"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                selectedCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c} onClick={() => setSelectedCategory(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  selectedCategory === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm text-muted-foreground">Loading services...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <div className="text-sm font-semibold mb-1">No services available</div>
          <div className="text-xs text-muted-foreground">Ask admin to sync products from DHRU</div>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-foreground/30">{items.length}</span>
              </h3>
              <div className="space-y-2">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} onSelect={() => setSelected(p)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <OrderModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default ServicesList;
