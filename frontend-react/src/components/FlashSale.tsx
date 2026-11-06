import React, { useState, useEffect } from 'react';
import { Zap, Flame } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../api';

interface FlashSaleProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
}

export const FlashSale: React.FC<FlashSaleProps> = ({ products, onAddToCart }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 45, seconds: 20 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fsProducts = products.filter(p => p.isFlashSale).slice(0, 6);

  if (fsProducts.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        {/* Flash Sale Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#ee4d2d] font-black text-lg tracking-wider">
              <Zap className="w-6 h-6 fill-[#ee4d2d]" />
              <span>FLASH SALE</span>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-1 font-mono font-bold text-xs text-white">
              <span className="bg-slate-900 px-1.5 py-0.5 rounded">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-slate-800 font-sans">:</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-slate-800 font-sans">:</span>
              <span className="bg-[#ee4d2d] px-1.5 py-0.5 rounded animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          <a href="#/flash-sale" className="text-xs font-bold text-[#ee4d2d] hover:underline flex items-center gap-1">
            Lihat Semua Promo Kilat &rsaquo;
          </a>
        </div>

        {/* Product Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100">
          {fsProducts.map((p) => {
            const soldPercent = Math.min(100, Math.max(20, Math.round(((p.flashSaleSold || 15) / (p.stock || 50)) * 100)));
            return (
              <div key={p.id} className="p-3 flex flex-col justify-between hover:shadow-md transition group bg-white">
                <div className="relative mb-2 aspect-square rounded overflow-hidden bg-slate-50">
                  <img
                    src={p.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  {p.discountPercent && p.discountPercent > 0 && (
                    <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                      -{p.discountPercent}%
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug mb-1">
                    {p.name}
                  </h4>
                  <div className="text-sm font-extrabold text-[#ee4d2d] mb-2">
                    {formatRupiah(p.price)}
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="relative h-4 bg-orange-100 rounded-full overflow-hidden flex items-center justify-center">
                    <div
                      style={{ width: `${soldPercent}%` }}
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-[#ee4d2d] rounded-full"
                    ></div>
                    <span className="relative z-10 text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-0.5 drop-shadow">
                      <Flame className="w-2.5 h-2.5 fill-white" />
                      TERJUAL {p.flashSaleSold || 18}
                    </span>
                  </div>

                  <button
                    onClick={() => onAddToCart(p)}
                    className="w-full mt-2 py-1 bg-[#be123c] hover:bg-[#9f1239] text-white text-[11px] font-bold rounded transition shadow-sm"
                  >
                    + Keranjang
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

