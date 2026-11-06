import React from 'react';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  imageUrl: string;
}

const categories: CategoryItem[] = [
  { id: '1', name: 'LCD & Layar', icon: '📱', imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=160&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Baterai HP', icon: '🔋', imageUrl: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=160&auto=format&fit=crop&q=80' },
  { id: '3', name: 'IC & Chipset', icon: '⚡', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=160&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Alat Servis & Blower', icon: '🛠️', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=160&auto=format&fit=crop&q=80' },
  { id: '5', name: 'Solder & Timah', icon: '🔥', imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=160&auto=format&fit=crop&q=80' },
  { id: '6', name: 'Lem & Perekat', icon: '🧪', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=160&auto=format&fit=crop&q=80' },
  { id: '7', name: 'Backdoor & Kaca', icon: '🪞', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&auto=format&fit=crop&q=80' },
  { id: '8', name: 'Alat Ukur & Tester', icon: '📟', imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=160&auto=format&fit=crop&q=80' },
  { id: '9', name: 'Pinset & Pembuka', icon: '✂️', imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=160&auto=format&fit=crop&q=80' },
  { id: '10', name: 'Sparepart Fleksibel', icon: '🔌', imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=160&auto=format&fit=crop&q=80' }
];

interface CategoriesProps {
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

export const Categories: React.FC<CategoriesProps> = ({ onSelectCategory, selectedCategory }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wide">
            Kategori Sparepart & Tools
          </h2>
          <span className="text-xs text-rose-600 font-bold">100% Produk 168part</span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 divide-x divide-y divide-slate-100">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? 'Semua' : cat.name)}
                className={`p-3 flex flex-col items-center text-center transition group relative hover:shadow-inner ${
                  isSelected ? 'bg-rose-50 border-2 border-rose-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden mb-2 bg-slate-100 border border-slate-200 group-hover:scale-105 transition shadow-sm">
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
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

