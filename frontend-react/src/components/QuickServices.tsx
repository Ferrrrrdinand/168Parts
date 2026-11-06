import React from 'react';

interface QuickService {
  title: string;
  icon: string;
}

const services: QuickService[] = [
  { title: '168 Original', icon: '⭐' },
  { title: 'LCD & Layar', icon: '📱' },
  { title: 'Baterai HP', icon: '🔋' },
  { title: 'IC & Chipset', icon: '⚡' },
  { title: 'Alat Servis & Blower', icon: '🛠️' },
  { title: 'Solder & Timah', icon: '🔥' },
  { title: 'Lem & Perekat', icon: '🧪' },
  { title: 'Flash Sale Teknisi', icon: '💥' },
  { title: 'Voucher Toko', icon: '🎟️' },
  { title: 'Garansi Tes', icon: '🛡️' }
];

export const QuickServices: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-3 sm:p-4">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center">
          {services.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center group cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-slate-200 flex items-center justify-center text-xl sm:text-2xl mb-1.5 shadow-sm group-hover:scale-110 group-hover:border-rose-500 transition">
                {item.icon}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 leading-tight line-clamp-2">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

