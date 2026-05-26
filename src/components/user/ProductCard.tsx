import React from 'react';
import { fmt } from '@/lib/format';
import { Clock, ChevronRight } from 'lucide-react';

interface Props {
  product: any;
  onSelect: () => void;
}

const ProductCard: React.FC<Props> = ({ product, onSelect }) => {
  const price = product.custom_price ?? product.price;
  const desc = product.custom_description || product.description;
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white border border-black/10 rounded-xl p-4 hover:border-black hover:shadow-lg transition group"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 shrink-0 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs uppercase">
          {product.service_type?.charAt(0) || 'S'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</div>
              {product.category_name && (
                <div className="text-xs text-black/50 mt-0.5 truncate">{product.category_name}</div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-black/30 group-hover:text-black shrink-0" />
          </div>
          {desc && (
            <p className="text-xs text-black/60 mt-2 line-clamp-2">{desc}</p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
            <div className="text-base font-bold">{fmt(price)}</div>
            {product.delivery_time && (
              <div className="flex items-center gap-1 text-xs text-black/60">
                <Clock className="w-3 h-3" />
                {product.delivery_time}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;
