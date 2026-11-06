import React from 'react';
import { BannerConfig } from '../types';

interface HeroBannersProps {
  banners: BannerConfig | null;
}

export const HeroBanners: React.FC<HeroBannersProps> = ({ banners }) => {
  const left = banners?.left || {
    badge: '⚡ 168 PARTS OFFICIAL',
    title: 'Pusat Sparepart & Alat Servis HP Surabaya',
    pills: [
      '🔧 LCD & Touchscreen Kualitas Pabrik',
      '📦 Ready Stock Surabaya Langsung Kirim',
      '⭐ Garansi Tes & Harga Grosir Teknisi'
    ],
    modelImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=85',
    bgGradient: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f43f5e 100%)'
  };

  const right = banners?.right || {
    title: 'Diskon Teknisi & Voucher',
    modelImage1: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=500&auto=format&fit=crop&q=85',
    modelImage2: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=85',
    pill1Title: 'DISKON TEKNISI',
    pill1Val: '70%',
    pill2Title: 'VOUCHER TOKO',
    pill2Val: '50RB',
    bgGradient: 'linear-gradient(135deg, #881337 0%, #9f1239 50%, #be123c 100%)'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-3 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Banner Kiri (Hero Left - 2 Columns on Desktop, Full Width on Mobile) */}
        <div
          style={{ background: left.bgGradient }}
          className="lg:col-span-2 rounded-lg p-5 sm:p-6 text-white flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[190px] sm:min-h-[220px]"
        >
          <div className="flex items-center justify-between gap-4 z-10 flex-1">
            <div className="flex-1 max-w-md">
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white font-extrabold text-[11px] px-3 py-1 rounded-full border border-white/30 tracking-wide mb-2">
                {left.badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow mb-3">
                {left.title}
              </h2>
              <div className="flex flex-col gap-1.5">
                {(left.pills || []).map((pill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 bg-white/95 text-slate-800 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow-sm w-fit max-w-full truncate"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Model Foto Kiri - Responsive Retina untuk HP & Laptop */}
            <div className="flex-shrink-0">
              <img
                src={left.modelImage}
                alt="Teknisi 168 Parts"
                loading="eager"
                decoding="async"
                className="w-20 sm:w-28 md:w-36 h-28 sm:h-36 md:h-44 object-cover rounded-lg border-2 border-white/90 shadow-md aspect-[3/4]"
              />
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-3 z-10">
            <span className="w-6 h-1.5 bg-white rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
          </div>
        </div>

        {/* Banner Kanan (Hero Right - Tersembunyi di Mobile, Tampil di Desktop) */}
        <div
          style={{ background: right.bgGradient }}
          className="hidden lg:flex rounded-lg p-4 text-white items-center justify-between gap-3 shadow-sm relative overflow-hidden min-h-[220px]"
        >
          <img
            src={right.modelImage1}
            alt="Model 1"
            className="w-20 h-36 object-cover rounded-md border border-white/80 shadow"
          />

          <div className="flex flex-col gap-2.5 items-center flex-1 text-center">
            <div className="bg-white rounded-md p-2.5 shadow w-full text-slate-900 border border-purple-200">
              <span className="block text-[10px] font-extrabold text-purple-700 tracking-wider">
                {right.pill1Title}
              </span>
              <span className="block text-2xl font-black text-purple-900">
                {right.pill1Val}
              </span>
            </div>

            <div className="bg-white rounded-md p-2.5 shadow w-full text-slate-900 border border-emerald-200">
              <span className="block text-[10px] font-extrabold text-emerald-700 tracking-wider">
                {right.pill2Title}
              </span>
              <span className="block text-2xl font-black text-emerald-800">
                {right.pill2Val}
              </span>
            </div>
          </div>

          <img
            src={right.modelImage2}
            alt="Model 2"
            className="w-20 h-36 object-cover rounded-md border border-white/80 shadow"
          />
        </div>
      </div>
    </div>
  );
};

