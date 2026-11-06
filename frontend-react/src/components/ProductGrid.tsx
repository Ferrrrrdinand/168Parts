import React from 'react';
import { Star, MapPin, Plus, Store } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../api';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  selectedCategory: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  selectedCategory
}) => {
  const filtered = selectedCategory && selectedCategory !== 'Semua'
    ? products.filter(p => p.category.toLowerCase().includes(selectedCategory.toLowerCase()))
    : products;

  return (
    <div className="max-w-7xl mx-auto px-4 mb-10">
      {/* Tab Filter Header */}
      <div className="bg-white rounded-t-lg border-b-2 border-[#be123c] p-3.5 flex items-center justify-between shadow-sm">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 bg-white p-3 rounded-b-lg border border-slate-100 shadow-sm">
        {filtered.map((p) => {
          const is168part = (p.shopName || '').toLowerCase().includes('168part');

          return (
            <div
              key={p.id}
              className="group bg-white border border-slate-100 rounded-lg overflow-hidden hover:border-rose-500 hover:shadow-lg transition flex flex-col justify-between relative"
            >
              {/* Product Image Box - Optimized for Mobile HP & Laptop Displays */}
              <div className="relative aspect-square bg-white border-b border-slate-100 overflow-hidden flex items-center justify-center p-1 sm:p-2">
                <img
                  src={p.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=85'}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge Toko Shopee / Star */}
                {is168part && (
                  <span className="absolute top-1 left-1 bg-[#ee4d2d] text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow">
                    <Store className="w-2.5 h-2.5" />
                    168PART
                  </span>
                )}

                {/* Diskon Badge */}
                {p.discountPercent && p.discountPercent > 0 && (
                  <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                    -{p.discountPercent}%
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-rose-700 transition mb-1">
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
                      {p.rating || 5.0}
                    </span>
                    <span>•</span>
                    <span>Terjual {p.soldCount || 120}</span>
                  </div>
                </div>

                <div>
                  {/* Location & Shop */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-1.5 mb-2">
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {p.location || 'Surabaya'}
                    </span>
                    <span className="truncate font-semibold text-slate-600">
                      {p.shopName || '168part Surabaya'}
                    </span>
                  </div>

                  {/* Quick Add Button */}
                  <button
                    onClick={() => onAddToCart(p)}
                    className="w-full py-1.5 bg-[#be123c] hover:bg-[#9f1239] text-white text-xs font-bold rounded flex items-center justify-center gap-1 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Beli</span>
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

