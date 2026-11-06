import React from 'react';
import { Home, Zap, Gift, ShoppingCart, User as UserIcon } from 'lucide-react';

interface MobileBottomNavProps {
  cartCount: number;
  promoCount: number;
  onOpenCart: () => void;
  onOpenPromo: () => void;
  onOpenAuth: () => void;
  onScrollToFlashSale: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  promoCount,
  onOpenCart,
  onOpenPromo,
  onOpenAuth,
  onScrollToFlashSale,
  activeTab,
  onSelectTab
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 shadow-lg z-40 flex items-center justify-around px-2">
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition ${
          activeTab === 'home' ? 'text-rose-700' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Beranda</span>
      </button>

      <button
        onClick={onScrollToFlashSale}
        className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <Zap className="w-5 h-5 text-orange-500 mb-0.5" />
        <span>Flash Sale</span>
      </button>

      <button
        onClick={onOpenPromo}
        className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition relative"
      >
        <Gift className="w-5 h-5 text-rose-600 mb-0.5" />
        <span>Promo</span>
        {promoCount > 0 && (
          <span className="absolute top-0 right-5 bg-red-500 text-white text-[9px] font-black px-1 rounded-full">
            {promoCount}
          </span>
        )}
      </button>

      <button
        onClick={onOpenCart}
        className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition relative"
      >
        <ShoppingCart className="w-5 h-5 mb-0.5" />
        <span>Keranjang</span>
        {cartCount > 0 && (
          <span className="absolute top-0 right-4 bg-[#ee4d2d] text-white text-[9px] font-black px-1 rounded-full">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </button>

      <button
        onClick={onOpenAuth}
        className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <UserIcon className="w-5 h-5 mb-0.5" />
        <span>Akun</span>
      </button>
    </nav>
  );
};

