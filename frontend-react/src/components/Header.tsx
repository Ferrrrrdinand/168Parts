import React, { useState } from 'react';
import { ShoppingCart, Search, Bell, HelpCircle, Globe, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onSearch: (keyword: string) => void;
  frequentSearches: string[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onSearch,
  frequentSearches,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    onSearch(tag);
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#be123c] text-white shadow-md">
      {/* Top Bar Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center text-xs text-rose-100 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 font-bold bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>👑 Dashboard Admin</span>
          </button>
          <span className="hidden sm:inline">📍 Toko Fisik: Surabaya</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden md:inline">Spesialis Sparepart & Alat Servis HP</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 hover:text-white cursor-pointer">
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notifikasi</span>
          </div>
          <div className="flex items-center gap-1 hover:text-white cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bantuan</span>
          </div>
          <div className="flex items-center gap-1 hover:text-white cursor-pointer">
            <Globe className="w-3.5 h-3.5" />
            <span>IDR (Rp)</span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2 font-semibold">
              <span className="bg-white/20 px-2 py-0.5 rounded text-white">{currentUser.name}</span>
              <button onClick={onLogout} className="text-rose-200 hover:text-white transition underline">
                Keluar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-bold">
              <button onClick={onOpenAuth} className="hover:text-white transition">
                Daftar
              </button>
              <span>|</span>
              <button onClick={onOpenAuth} className="hover:text-white transition">
                Log In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Search & Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 sm:gap-8">
        {/* Logo Brand */}
        <a href="#/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition text-rose-700">
            <span className="text-2xl font-black">168</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow">168 Parts</span>
            <span className="text-[10px] tracking-wider font-semibold text-rose-200 uppercase -mt-1 hidden sm:block">
              Pusat Sparepart & Alat Servis HP Surabaya
            </span>
          </div>
        </a>

        {/* Search Bar & Frequent Tag Suggestions */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari sparepart LCD, Baterai, IC, Lem I9, Blower, Solder..."
              className="w-full h-10 pl-4 pr-12 rounded bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1 w-9 h-8 bg-[#be123c] hover:bg-[#9f1239] text-white rounded flex items-center justify-center transition shadow"
              aria-label="Cari"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Frequent Search Chips */}
          <div className="hidden sm:flex items-center gap-1.5 mt-1.5 overflow-x-auto no-scrollbar text-[11px] text-rose-100">
            {frequentSearches.slice(0, 6).map((tag, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full transition whitespace-nowrap"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Icon Button */}
        <button
          onClick={onOpenCart}
          className="relative p-2.5 rounded-lg hover:bg-white/10 transition flex-shrink-0 text-white flex items-center gap-1"
          aria-label="Buka Keranjang Belanja"
        >
          <ShoppingCart className="w-7 h-7" />
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 bg-amber-400 text-slate-900 font-black text-[11px] px-1.5 py-0.2 rounded-full border-2 border-[#881337] animate-pulse shadow">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

