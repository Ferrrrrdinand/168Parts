import React, { useState, useEffect, useMemo } from 'react';
import { Product, FeedTab, SortOption, FeedProps } from '../types/product';
import { ProductCard } from './ProductCard';
import './Feed.css';

// Fallback Mock Data produk awal
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'DJI Osmo Action 4 Standard Combo 4K/120fps Ultra Waterproof',
    category: 'Fotografi',
    price: 3940000,
    originalPrice: 4899000,
    discountPercent: 20,
    rating: 4.9,
    soldCount: 1420,
    stock: 45,
    location: 'Jakarta Barat',
    shopName: 'DJI Official Store',
    shopType: 'Mall',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80',
    isFlashSale: true,
  },
  {
    id: 'prod-2',
    name: 'iPhone 12 256GB Garansi Resmi iBox Indonesia Garansi 1 Tahun',
    category: 'Handphone',
    price: 3599000,
    originalPrice: 4500000,
    discountPercent: 20,
    rating: 4.8,
    soldCount: 980,
    stock: 20,
    location: 'Jakarta Selatan',
    shopName: 'Apple Authorized Store',
    shopType: 'Mall',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=80',
    isFlashSale: true,
  },
  {
    id: 'prod-3',
    name: 'Insta360 X4 Kamera 360 8K Ultra Waterproof Flagship Action Cam',
    category: 'Fotografi',
    price: 6990000,
    originalPrice: 7999000,
    discountPercent: 13,
    rating: 4.9,
    soldCount: 650,
    stock: 15,
    location: 'Jakarta Pusat',
    shopName: 'Action Cam Center',
    shopType: 'Star+',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80',
    isFlashSale: false,
  },
  {
    id: 'prod-4',
    name: 'Goojodoq Multipurpose Laptop Bag Waterproof Shockproof Sleeve',
    category: 'Komputer',
    price: 156000,
    originalPrice: 220000,
    discountPercent: 29,
    rating: 4.9,
    soldCount: 4200,
    stock: 120,
    location: 'Surabaya',
    shopName: 'GOOJODOQ Official Store',
    shopType: 'Mall',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
    isFlashSale: true,
  },
  {
    id: 'prod-5',
    name: 'Sneakers Pria Casual Streetwear Black White Sporty Lightweight',
    category: 'Sepatu Pria',
    price: 255000,
    originalPrice: 350000,
    discountPercent: 27,
    rating: 4.7,
    soldCount: 890,
    stock: 60,
    location: 'Bandung',
    shopName: 'Urban Kicks Store',
    shopType: 'Star',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80',
    isFlashSale: false,
  },
  {
    id: 'prod-6',
    name: 'Mechanical Gaming Keyboard RGB Hot-Swappable Blue Switch',
    category: 'Komputer',
    price: 499000,
    originalPrice: 750000,
    discountPercent: 33,
    rating: 4.8,
    soldCount: 1850,
    stock: 35,
    location: 'Tangerang',
    shopName: 'Gaming Gear ID',
    shopType: 'Star+',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    isFlashSale: true,
  },
  {
    id: 'prod-7',
    name: 'Wireless Noise Cancelling Headphones Over-Ear Bass Booster',
    category: 'Elektronik',
    price: 899000,
    originalPrice: 1200000,
    discountPercent: 25,
    rating: 4.9,
    soldCount: 740,
    stock: 28,
    location: 'Jakarta Barat',
    shopName: 'Audio Pro Store',
    shopType: 'Mall',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    isFlashSale: false,
  },
  {
    id: 'prod-8',
    name: 'Smartwatch AMOLED Display Heart Rate & SpO2 Water Resistant',
    category: 'Elektronik',
    price: 649000,
    originalPrice: 999000,
    discountPercent: 35,
    rating: 4.7,
    soldCount: 1120,
    stock: 50,
    location: 'Semarang',
    shopName: 'TechGadget Official',
    shopType: 'Star+',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    isFlashSale: true,
  },
];

const CATEGORIES = [
  'Semua',
  'Elektronik',
  'Komputer',
  'Handphone',
  'Fotografi',
  'Sepatu Pria',
  'Pakaian Pria',
];

export const Feed: React.FC<FeedProps> = ({
  initialProducts,
  apiEndpoint = 'http://localhost:3000/api/products',
  onProductClick,
  onAddToCart,
  title = 'Rekomendasi Produk Pilihan',
}) => {
  const [products, setProducts] = useState<Product[]>(
    initialProducts || DEFAULT_PRODUCTS
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('rekomendasi');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [activeSort, setActiveSort] = useState<SortOption>('default');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch dari Backend API jika initialProducts kosong
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) return;

    let isMounted = true;
    setLoading(true);

    fetch(apiEndpoint)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data && Array.isArray(data.data)) {
          setProducts(data.data);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat API, menggunakan data default lokal:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [apiEndpoint, initialProducts]);

  // Handle Quick Add to Cart with Toast
  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product, 1);
    }
    showToast(`✓ "${product.name.slice(0, 24)}..." ditambahkan ke keranjang!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter Tab
    if (activeTab === 'flash_sale') {
      result = result.filter((p) => p.isFlashSale);
    } else if (activeTab === 'terlaris') {
      result = result.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    } else if (activeTab === 'diskon') {
      result = result.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    }

    // Filter Kategori
    if (activeCategory !== 'Semua') {
      result = result.filter(
        (p) =>
          p.category &&
          p.category.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    // Filter Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q))
      );
    }

    // Sortir
    if (activeSort === 'sold_desc') {
      result.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    } else if (activeSort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, activeTab, activeCategory, activeSort, searchQuery]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  return (
    <section className="feed-container">
      {/* Toast Alert Pop-up */}
      {toastMessage && <div className="feed-toast">{toastMessage}</div>}

      {/* Header Feed & Tabs */}
      <div className="feed-header">
        <h2 className="feed-title">{title}</h2>

        <div className="feed-tabs">
          <button
            className={`feed-tab-btn ${activeTab === 'rekomendasi' ? 'active' : ''}`}
            onClick={() => setActiveTab('rekomendasi')}
          >
            🔥 Rekomendasi
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'terlaris' ? 'active' : ''}`}
            onClick={() => setActiveTab('terlaris')}
          >
            👑 Terlaris
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'diskon' ? 'active' : ''}`}
            onClick={() => setActiveTab('diskon')}
          >
            🏷️ Diskon Terbesar
          </button>
          <button
            className={`feed-tab-btn tab-flash ${activeTab === 'flash_sale' ? 'active' : ''}`}
            onClick={() => setActiveTab('flash_sale')}
          >
            ⚡ Flash Sale
          </button>
        </div>
      </div>

      {/* Filter & Sorting Controls */}
      <div className="feed-filter-bar">
        {/* Category Chips */}
        <div className="feed-category-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort & Search Controls */}
        <div className="feed-sort-wrap">
          <div className="feed-search-input-wrap">
            <input
              type="text"
              placeholder="Cari dalam rekomendasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="feed-search-input"
            />
            {searchQuery && (
              <button
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          <div className="feed-sort-select-wrap">
            <span className="sort-label">Urutkan:</span>
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as SortOption)}
              className="feed-sort-select"
            >
              <option value="default">Terkait</option>
              <option value="sold_desc">Terlaris</option>
              <option value="price_asc">Harga: Terendah</option>
              <option value="price_desc">Harga: Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="feed-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="feed-skeleton-card">
              <div className="skeleton-pic shimmer"></div>
              <div className="skeleton-line shimmer" style={{ width: '85%' }}></div>
              <div className="skeleton-line shimmer" style={{ width: '55%' }}></div>
              <div className="skeleton-line shimmer" style={{ width: '40%' }}></div>
            </div>
          ))}
        </div>
      ) : displayedProducts.length === 0 ? (
        /* Empty State */
        <div className="feed-empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Tidak ada produk yang cocok</h3>
          <p>Coba gunakan kata kunci lain atau ubah filter kategori Anda.</p>
          <button
            className="btn-reset-filter"
            onClick={() => {
              setActiveCategory('Semua');
              setSearchQuery('');
              setActiveTab('rekomendasi');
              setActiveSort('default');
            }}
          >
            Reset Filter
          </button>
        </div>
      ) : (
        /* Product Grid (Responsive: 6-Col Desktop, 4-Col Tablet, 2-Col Mobile) */
        <div className="feed-grid">
          {displayedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              rankIndex={activeTab === 'terlaris' || index < 3 ? index : undefined}
              onClick={onProductClick}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {filteredProducts.length > visibleCount && (
        <div className="feed-load-more-wrap">
          <button
            className="btn-load-more"
            onClick={() => setVisibleCount((prev) => prev + 6)}
          >
            Lihat Lebih Banyak ({filteredProducts.length - visibleCount} Produk Tersisa) ↓
          </button>
        </div>
      )}
    </section>
  );
};

export default Feed;

