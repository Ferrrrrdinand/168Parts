import React from 'react';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  bgGrad: string;
}

const categories: CategoryItem[] = [
  { id: '1', name: 'Alat Servis & Blower', icon: '🛠️', bgGrad: 'from-amber-500 to-orange-600' },
  { id: '2', name: 'LCD & Layar', icon: '📱', bgGrad: 'from-blue-500 to-indigo-600' },
  { id: '3', name: 'IC & Chipset', icon: '⚡', bgGrad: 'from-amber-400 to-yellow-500' },
  { id: '4', name: 'Sparepart Fleksibel', icon: '🔌', bgGrad: 'from-purple-500 to-violet-600' },
  { id: '5', name: 'Solder & Timah', icon: '🔥', bgGrad: 'from-red-500 to-rose-600' },
  { id: '6', name: 'Backdoor & Kaca', icon: '🪞', bgGrad: 'from-cyan-500 to-blue-600' },
  { id: '7', name: 'Pinset & Pembuka', icon: '✂️', bgGrad: 'from-slate-600 to-slate-800' },
  { id: '8', name: 'Baterai HP', icon: '🔋', bgGrad: 'from-emerald-500 to-teal-600' },
  { id: '9', name: 'Lem & Perekat', icon: '🧪', bgGrad: 'from-pink-500 to-rose-500' },
  { id: '10', name: 'Alat Ukur & Tester', icon: '📟', bgGrad: 'from-teal-500 to-emerald-600' }
];

interface CategoriesProps {
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

export const Categories: React.FC<CategoriesProps> = ({ onSelectCategory, selectedCategory }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-white rounded-lg shadow-xs border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wide">
            KATEGORI RESMI SPAREPART & TOOLS
          </h2>
          <span className="text-xs text-rose-600 font-bold">10 Kategori Lengkap • 168 Parts</span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 divide-x divide-y divide-slate-100">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? 'Semua' : cat.name)}
                className={`p-3 flex flex-col items-center text-center transition group relative cursor-pointer ${
                  isSelected ? 'bg-rose-50 border-2 border-[#ee4d2d]' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center mb-1.5 text-2xl bg-gradient-to-br ${cat.bgGrad} shadow-xs text-white group-hover:scale-110 transition-transform`}>
                  <span>{cat.icon}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
