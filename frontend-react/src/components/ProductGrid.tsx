import React from 'react';
import { Star, MapPin, Plus, Store, Wrench, Cpu, Smartphone, Layers, Battery, Eye } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../api';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onSelectProduct?: (p: Product) => void;
  selectedCategory: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onSelectProduct,
  selectedCategory
}) => {
  const filtered = selectedCategory && selectedCategory !== 'Semua'
    ? products.filter(p => p.category.toLowerCase().includes(selectedCategory.toLowerCase()))
    : products;

  return (
    <div className="max-w-7xl mx-auto px-4 mb-10">
      {/* Tab Filter Header */}
      <div className="bg-white rounded-t-lg border-b-2 border-[#be123c] p-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase">
            {selectedCategory && selectedCategory !== 'Semua'
              ? `Kategori: ${selectedCategory}`
              : 'Rekomendasi Sparepart 168 Parts'}
          </span>
          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {filtered.length} Produk
          </span>
        </div>
        <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
          Ready Stock Surabaya • Garansi Tes
        </span>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 bg-white p-3 rounded-b-lg border border-slate-100 shadow-xs">
        {filtered.map((p) => {
          const is168part = (p.shopName || '').toLowerCase().includes('168part') || true;

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct && onSelectProduct(p)}
              className="group bg-white border border-slate-100 rounded-lg overflow-hidden hover:border-[#ee4d2d] hover:shadow-md transition flex flex-col justify-between relative cursor-pointer"
            >
              {/* Product Media Box - Clean Hardware Icon/Placeholder */}
              <div className="relative aspect-square bg-slate-50 border-b border-slate-100 overflow-hidden flex flex-col items-center justify-center p-3 text-center">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#ee4d2d] transition">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-1 shadow-2xs group-hover:border-rose-300">
                      {getCategoryIcon(p.category)}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      168 PARTS
                    </span>
                  </div>
                )}

                {/* Badge Toko Shopee / Star */}
                {is168part && (
                  <span className="absolute top-1 left-1 bg-[#ee4d2d] text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                    <Store className="w-2.5 h-2.5" />
                    Star
                  </span>
                )}

                {/* Diskon Badge */}
                {p.discountPercent && p.discountPercent > 0 && (
                  <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                    -{p.discountPercent}%
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-[#ee4d2d] transition mb-1">
                    {p.name}
                  </h3>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-sm font-black text-[#ee4d2d]">
                      {formatRupiah(p.price)}
                    </span>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatRupiah(p.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Rating & Sold count */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                    <span className="flex items-center text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-400 inline mr-0.5" />
                      {p.rating || 4.9}
                    </span>
                    <span>•</span>
                    <span>{p.soldCount ? `${p.soldCount} terjual` : '2RB+ terjual'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                    Kota Surabaya
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(p);
                    }}
                    title="Tambah Cepat ke Keranjang"
                    className="w-6 h-6 rounded bg-rose-50 text-rose-700 hover:bg-[#ee4d2d] hover:text-white transition flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function getCategoryIcon(cat: string) {
  const c = (cat || '').toLowerCase();
  if (c.includes('lcd') || c.includes('layar')) return <Smartphone className="w-6 h-6 text-blue-500" />;
  if (c.includes('ic') || c.includes('chip')) return <Cpu className="w-6 h-6 text-amber-500" />;
  if (c.includes('baterai')) return <Battery className="w-6 h-6 text-emerald-500" />;
  if (c.includes('fleksibel') || c.includes('backdoor')) return <Layers className="w-6 h-6 text-purple-500" />;
  return <Wrench className="w-6 h-6 text-rose-500" />;
}
