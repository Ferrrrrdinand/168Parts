import React, { useState, useEffect } from 'react';
import { Zap, Flame, ShoppingCart, Smartphone, Cpu, Battery, Wrench } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../api';

interface FlashSaleProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onSelectProduct?: (p: Product) => void;
}

export const FlashSale: React.FC<FlashSaleProps> = ({ products, onAddToCart, onSelectProduct }) => {
  // Hitung sisa waktu 24 jam menuju jam 12 malam (00:00:00 WIB)
  const calculateTimeUntilMidnight = () => {
    const now = new Date();
    // Jam 12 malam berikutnya
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const diff = Math.max(0, midnight.getTime() - now.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeUntilMidnight);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fsProducts = products.filter(p => p.isFlashSale).slice(0, 6);

  if (fsProducts.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-white rounded-lg shadow-xs border border-slate-100 overflow-hidden">
        {/* Flash Sale Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-orange-50 via-rose-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#ee4d2d] font-black text-lg tracking-wider">
              <Zap className="w-5 h-5 fill-[#ee4d2d]" />
              <span>FLASH SALE 24 JAM</span>
            </div>

            {/* Countdown Badge Menuju Jam 12 Malam */}
            <div className="flex items-center gap-1 font-mono font-bold text-xs text-white">
              <span className="bg-slate-900 px-1.5 py-0.5 rounded shadow-xs">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-slate-800 font-sans">:</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded shadow-xs">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-slate-800 font-sans">:</span>
              <span className="bg-[#ee4d2d] px-1.5 py-0.5 rounded shadow-xs animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full hidden sm:inline">
              🔄 Reset Otomatis Jam 00:00 WIB
            </span>
          </div>

          <span className="text-xs font-bold text-[#ee4d2d] flex items-center gap-1">
            🔥 Penawaran Terbatas Hari Ini
          </span>
        </div>

        {/* Product Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100">
          {fsProducts.map((p) => {
            const soldCount = p.flashSaleSoldUnits || p.flashSaleSold || 25;
            const soldPercent = Math.min(95, Math.max(35, Math.round((soldCount / (p.stock || 49)) * 100)));

            return (
              <div 
                key={p.id} 
                onClick={() => onSelectProduct && onSelectProduct(p)}
                className="p-3 flex flex-col justify-between hover:shadow-md transition group bg-white cursor-pointer relative"
              >
                <div className="relative mb-2 aspect-square rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-2 text-center">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#ee4d2d] transition">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-1 shadow-2xs">
                        {getCategoryIcon(p.category)}
                      </div>
                      <span className="text-[8.5px] font-bold text-slate-400">⚡ FLASH SALE</span>
                    </div>
                  )}

                  {p.discountPercent && p.discountPercent > 0 && (
                    <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                      -{p.discountPercent}%
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug mb-1 group-hover:text-[#ee4d2d] transition">
                    {p.name}
                  </h4>

                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className="text-sm font-black text-[#ee4d2d]">
                      {formatRupiah(p.price)}
                    </span>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatRupiah(p.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar Terjual */}
                  <div className="space-y-1">
                    <div className="w-full bg-rose-100 rounded-full h-3.5 relative overflow-hidden flex items-center justify-center">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-[#ee4d2d] rounded-full transition-all duration-500"
                        style={{ width: `${soldPercent}%` }}
                      />
                      <span className="relative z-10 text-[9px] font-extrabold text-white uppercase tracking-tight flex items-center gap-0.5 px-1 drop-shadow-xs">
                        <Flame className="w-2.5 h-2.5 fill-white inline" />
                        {soldPercent >= 80 ? '🔥 Segera Habis' : `Terjual ${soldCount} pcs`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(p);
                  }}
                  className="mt-3 w-full py-1.5 bg-rose-50 text-[#ee4d2d] hover:bg-[#ee4d2d] hover:text-white rounded text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Beli</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function getCategoryIcon(cat: string) {
  const c = (cat || '').toLowerCase();
  if (c.includes('lcd') || c.includes('layar')) return <Smartphone className="w-5 h-5 text-blue-500" />;
  if (c.includes('ic') || c.includes('chip')) return <Cpu className="w-5 h-5 text-amber-500" />;
  if (c.includes('baterai')) return <Battery className="w-5 h-5 text-emerald-500" />;
  return <Wrench className="w-5 h-5 text-rose-500" />;
}
