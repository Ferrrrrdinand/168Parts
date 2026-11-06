import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroBanners } from './components/HeroBanners';
import { QuickServices } from './components/QuickServices';
import { Categories } from './components/Categories';
import { FlashSale } from './components/FlashSale';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { PromoModal } from './components/PromoModal';
import { DockedActionBar } from './components/DockedActionBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { RealisticLoader } from './components/RealisticLoader';

import { Product, Promo, BannerConfig, CartItem, User } from './types';
import { fetchProducts, fetchBanners, fetchActivePromos } from './api';
import { fallbackProducts, fallbackBanners, fallbackPromos } from './fallbackData';

export function App() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [banners, setBanners] = useState<BannerConfig | null>(fallbackBanners);
  const [promos, setPromos] = useState<Promo[]>(fallbackPromos);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);

  // Cart & Orders State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pasarin_react_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pasarin_react_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Frequent Searches
  const [frequentSearches, setFrequentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pasarin_react_searches');
      return saved ? JSON.parse(saved) : [
        '168part', 'Lem LCD', 'Solder Station', 'Backdoor Samsung', 'Baterai OEM', 'IC Charger'
      ];
    } catch (e) {
      return ['168part', 'Lem LCD', 'Solder Station', 'Backdoor Samsung'];
    }
  });

  // Modals & Navigation Views
  const [currentView, setCurrentView] = useState<'store' | 'checkout' | 'admin'>('store');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('home');

  // Load initial data from Backend API
  const loadStoreData = async () => {
    try {
      const [pList, bData, prList] = await Promise.all([
        fetchProducts(),
        fetchBanners(),
        fetchActivePromos()
      ]);
      setProducts(pList);
      setBanners(bData);
      setPromos(prList);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      // Natural pacing for smooth physics animation experience
      setTimeout(() => {
        setIsLoading(false);
      }, 650);
    }
  };

  useEffect(() => {
    loadStoreData();
    // Safety fallback: guaranteed to stop loading state within 1.5s
    const fallback = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(fallback);
  }, []);

  // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('pasarin_react_cart', JSON.stringify(cart));
  }, [cart]);

  // Save User to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pasarin_react_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pasarin_react_user');
      localStorage.removeItem('pasarin_react_token');
    }
  }, [currentUser]);

  // Cart Operations
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Search Operation
  const handleSearch = async (keyword: string) => {
    if (!keyword) return;

    // Record to frequent searches
    setFrequentSearches(prev => {
      const updated = [keyword, ...prev.filter(k => k.toLowerCase() !== keyword.toLowerCase())].slice(0, 8);
      localStorage.setItem('pasarin_react_searches', JSON.stringify(updated));
      return updated;
    });

    const results = await fetchProducts(`?q=${encodeURIComponent(keyword)}`);
    setProducts(results);
    setSelectedCategory('Semua');
    setCurrentView('store');
  };

  // Place Order Submit
  const handlePlaceOrder = async (orderData: any) => {
    try {
      const token = localStorage.getItem('pasarin_react_token');
      const payload = {
        ...orderData,
        items: cart.map(it => ({
          productId: it.product.id,
          name: it.product.name,
          price: it.product.price,
          quantity: it.quantity
        }))
      };

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCart([]);
        setAppliedPromo(null);
        return true;
      } else {
        alert(data.message || 'Gagal checkout pesanan.');
        return false;
      }
    } catch (e: any) {
      alert(e.message || 'Koneksi error saat checkout.');
      return false;
    }
  };

  const handleScrollToFlashSale = () => {
    setCurrentView('store');
    const el = document.getElementById('flash-sale-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If in Admin view, render AdminDashboard
  if (currentView === 'admin') {
    return (
      <AdminDashboard
        onBackToStore={() => {
          setCurrentView('store');
          loadStoreData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] pb-16 sm:pb-8">
      {/* Realistis Physics Shopping Cart Loader */}
      <RealisticLoader isLoading={isLoading} />

      {/* Global Header */}
      <Header
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onSearch={handleSearch}
        frequentSearches={frequentSearches}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => setCurrentUser(null)}
        onOpenAdmin={() => setCurrentView('admin')}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'checkout' ? (
          <CheckoutView
            cart={cart}
            onBackToShopping={() => setCurrentView('store')}
            onOpenPromoModal={() => setIsPromoModalOpen(true)}
            appliedPromo={appliedPromo}
            onRemovePromo={() => setAppliedPromo(null)}
            onPlaceOrder={handlePlaceOrder}
          />
        ) : (
          <>
            {/* Split Hero Banners */}
            <HeroBanners banners={banners} />

            {/* 10 Quick Service Icon Shortcuts */}
            <QuickServices />

            {/* 10 Categories Grid */}
            <Categories
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              selectedCategory={selectedCategory}
            />

            {/* Flash Sale Section */}
            <div id="flash-sale-section">
              <FlashSale products={products} onAddToCart={handleAddToCart} />
            </div>

            {/* Product Recommendations & 168part Store Catalog */}
            <ProductGrid
              products={products}
              onAddToCart={handleAddToCart}
              selectedCategory={selectedCategory}
            />
          </>
        )}
      </main>

      {/* Footer 168 Parts */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-rose-600 text-white font-black rounded flex items-center justify-center text-sm shadow">
                168
              </div>
              <span className="font-black text-base text-slate-900 tracking-tight">168 Parts</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Pusat penjualan sparepart smartphone, LCD, Baterai, IC Chipset, dan alat servis teknisi terlengkap langsung dari Surabaya.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs mb-2">Layanan Pelanggan</h4>
            <ul className="space-y-1.5">
              <li>• Bantuan & FAQ</li>
              <li>• Garansi Tes Sparepart</li>
              <li>• Cara Belanja Mandiri</li>
              <li>• Konfirmasi Pembayaran</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs mb-2">Keunggulan 168 Parts</h4>
            <ul className="space-y-1.5">
              <li>• 100% Produk Original / Berkualitas</li>
              <li>• Bebas Biaya Komisi Marketplace</li>
              <li>• Pengiriman Cepat dari Surabaya</li>
              <li>• Harga Grosir Spesial Mitra Teknisi HP</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs mb-2">Lokasi & Pengiriman</h4>
            <p className="leading-relaxed">
              📍 Kota Surabaya, Jawa Timur, Indonesia.<br />
              Melayani pengiriman ke seluruh pelosok Nusantara via JNE, J&amp;T, SiCepat, SPX, dan Instant GoSend/Grab.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>&copy; {new Date().getFullYear()} 168 Parts Surabaya. All Rights Reserved.</span>
          <span className="font-semibold text-rose-600">Platform Toko Online Bebas Potongan Komisi</span>
        </div>
      </footer>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onGoToCheckout={() => {
          setIsCartOpen(false);
          setCurrentView('checkout');
        }}
      />

      {/* Voucher & Promo Modal */}
      <PromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        promos={promos}
        onApplyPromo={(p) => setAppliedPromo(p)}
        appliedPromo={appliedPromo}
        totalAmount={cart.reduce((s, it) => s + it.product.price * it.quantity, 0)}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user, token) => {
          setCurrentUser(user);
          localStorage.setItem('pasarin_react_token', token);
        }}
      />

      {/* Desktop Docked Action Bar (Shopee Style) */}
      <DockedActionBar
        onOpenPromo={() => setIsPromoModalOpen(true)}
        promoCount={promos.length}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        cartCount={cartCount}
        promoCount={promos.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPromo={() => setIsPromoModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onScrollToFlashSale={handleScrollToFlashSale}
        activeTab={activeMobileTab}
        onSelectTab={(tab) => {
          setActiveMobileTab(tab);
          if (tab === 'home') setCurrentView('store');
        }}
      />
    </div>
  );
}

export default App;
