import React from 'react';
import { MessageSquare, Gift } from 'lucide-react';

interface DockedActionBarProps {
  onOpenPromo: () => void;
  promoCount: number;
}

export const DockedActionBar: React.FC<DockedActionBarProps> = ({
  onOpenPromo,
  promoCount
}) => {
  return (
    <div className="fixed bottom-0 right-4 sm:right-6 z-40 hidden sm:flex items-end gap-2 pointer-events-auto">
      {/* Tombol Promo Spesial */}
      <button
        onClick={onOpenPromo}
        className="h-9 px-4 bg-[#be123c] hover:bg-[#9f1239] text-white text-xs font-bold rounded-t-md border border-white/20 border-b-0 shadow-lg flex items-center gap-1.5 transition transform hover:-translate-y-0.5"
      >
        <Gift className="w-4 h-4 text-yellow-300" />
        <span>Voucher & Promo</span>
        {promoCount > 0 && (
          <span className="bg-white text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow">
            {promoCount}
          </span>
        )}
      </button>

      {/* Tombol Chat Shopee Style */}
      <button
        onClick={() => alert('Fitur Chat siap menghubungkan Anda langsung dengan Teknisi & Admin 168 Parts!')}
        className="h-9 px-4 bg-[#881337] hover:bg-[#700e2b] text-white text-xs font-bold rounded-t-md border border-white/20 border-b-0 shadow-lg flex items-center gap-1.5 transition transform hover:-translate-y-0.5"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Chat Penjual</span>
      </button>
    </div>
  );
};

