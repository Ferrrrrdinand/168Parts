/* =========================================================
   Pasarin Indonesia - Main Application Controller
   Modern, Vibrant, High-Resolution Product Showcase
   ========================================================= */

window.showToast = function (message, type = 'info') {
  let toastContainer = document.getElementById('pasarin-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'pasarin-toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

const PasarinApp = {
  products: [],
  filteredProducts: [],
  categories: [],
  activeCategory: 'Semua',
  activeSort: 'relevance',
  searchQuery: '',
  priceRange: { min: null, max: null },
  selectedRating: null,
  selectedLocation: null,

  // Palet tema warna kategori
  categoryThemes: {
    "Elektronik": { bg: "#e0f2fe", color: "#0284c7" },
    "Komputer & Aksesoris": { bg: "#e0e7ff", color: "#4f46e5" },
    "HP & Aksesoris": { bg: "#dcfce7", color: "#16a34a" },
    "Pakaian Pria": { bg: "#fef3c7", color: "#d97706" },
    "Sepatu Pria": { bg: "#ffedd5", color: "#ea580c" },
    "Tas Pria": { bg: "#ffe4e6", color: "#e11d48" },
    "Jam Tangan": { bg: "#cffafe", color: "#0891b2" },
    "Kesehatan": { bg: "#fee2e2", color: "#dc2626" },
    "Hobi & Koleksi": { bg: "#f3e8ff", color: "#9333ea" },
    "Makanan & Minuman": { bg: "#fef9c3", color: "#ca8a04" },
    "Perawatan & Kecantikan": { bg: "#fce7f3", color: "#db2777" },
    "Perlengkapan Rumah": { bg: "#ccfbf1", color: "#0d9488" },
    "Pakaian Wanita": { bg: "#fdf2f8", color: "#c026d3" },
    "Fashion Muslim": { bg: "#ecfdf5", color: "#059669" },
    "Ibu & Bayi": { bg: "#fef2f2", color: "#f43f5e" },
    "Sepatu Wanita": { bg: "#fff1f2", color: "#e11d48" },
    "Tas Wanita": { bg: "#fae8ff", color: "#a855f7" },
    "Aksesoris Fashion": { bg: "#fff7ed", color: "#ea580c" },
    "Fotografi": { bg: "#ede9fe", color: "#7c3aed" },
    "Otomotif": { bg: "#f1f5f9", color: "#475569" }
  },

  async init() {
    this.initTimer();
    this.bindGlobalEvents();
    if (window.PasarinSearchHistory) window.PasarinSearchHistory.init();
    await this.loadInitialData();
    this.initPromoSystem();
    await this.loadBanners();
    this.route();
    window.addEventListener('hashchange', () => this.route());
  },

  formatRupiah(num) {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  },

  formatSoldCount(count) {
    const n = Number(count) || 0;
    if (n >= 1000) {
      const k = (n / 1000).toFixed(1).replace('.0', '').replace('.', ',');
      return `${k}rb+ terjual`;
    }
    return `${n}+ terjual`;
  },

  renderIcon(name, cls = 'i') {
    if (window.PasarinIcons) {
      return window.PasarinIcons.get(name, cls);
    }
    return '';
  },

  renderProductFallback(imgEl, category, icon) {
    if (!imgEl || !imgEl.parentElement) return;
    const theme = this.categoryThemes[category] || { bg: "#f1f5f9", color: "#ee4d2d" };
    const iconSvg = this.renderIcon(icon || 'bag', 'i');
    imgEl.parentElement.innerHTML = `
      <div class="prod-fallback-wrap" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${theme.bg}; color: ${theme.color}; transition: all 0.3s ease;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 6px;">
          <div style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            ${iconSvg}
          </div>
        </div>
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">${category || 'Pasarin'}</span>
      </div>
    `;
  },

  renderProductMedia(p, fallbackCls = 'i lg') {
    const theme = this.categoryThemes[p.category] || { bg: "#f1f5f9", color: "#ee4d2d" };
    const iconSvg = this.renderIcon(p.icon || 'bag', 'i');
    const fallbackDOM = `
      <div class="prod-fallback-wrap" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${theme.bg}; color: ${theme.color};">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 6px;">
          <div style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            ${iconSvg}
          </div>
        </div>
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">${p.category || 'Pasarin'}</span>
      </div>
    `;

    if (p.image) {
      return `<img src="${p.image}" alt="${p.name}" class="prod-real-img" loading="lazy" onerror="PasarinApp.renderProductFallback(this, '${(p.category || "").replace(/'/g, "\\'")}', '${p.icon || 'bag'}')">`;
    }
    return fallbackDOM;
  },

  async loadInitialData() {
    const [prodRes, catRes, flashRes, promoRes] = await Promise.all([
      PasarinAPI.getProducts(),
      PasarinAPI.getCategories(),
      PasarinAPI.getFlashSale(),
      PasarinAPI.getPromos()
    ]);

    if (prodRes && prodRes.success && prodRes.data && prodRes.data.length > 0) {
      this.products = prodRes.data;
    } else {
      this.products = this.getFallbackProducts();
    }

    if (catRes && catRes.success && catRes.data && catRes.data.length > 0) {
      this.categories = catRes.data;
    } else {
      this.categories = this.getFallbackCategories();
    }

    if (promoRes && promoRes.success && promoRes.data && promoRes.data.length > 0) {
      this.promos = promoRes.data.map(p => ({
        code: p.code,
        category: p.category || 'diskon',
        title: p.title,
        desc: p.description || p.title,
        valText: p.discountType === 'percent' ? `${p.discountValue}% OFF` : `Rp${Math.round(p.discountValue / 1000)}RB`,
        typeText: p.discountType === 'percent' ? `Diskon ${p.discountValue}%` : 'Potongan Langsung',
        icon: p.category === 'ongkir' ? '🚚' : (p.category === 'cashback' ? '💰' : (p.category === 'lokal' ? '🏬' : '🎁')),
        minSpend: p.minSpend > 0 ? `Min. Belanja Rp${p.minSpend.toLocaleString('id-ID')}` : 'Min. Belanja Rp0',
        validUntil: 'Berlaku s.d akhir bulan',
        quota: `Kuota: ${p.quota - p.usedCount} tersisa`
      }));
      this.renderPromoTickets();
      this.updatePromoBadgeCount();
    }

    this.renderHomeQuickNav();
    this.renderHomeCategories();
    this.renderFlashSale(flashRes && flashRes.data && flashRes.data.length > 0 ? flashRes.data : this.products.filter(p => p.isFlashSale));
    this.renderHomeGrid();
  },

  getFallbackCategories() {
    return [
      { id: "elektronik", name: "Elektronik", icon: "head", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=160&auto=format&fit=crop&q=80" },
      { id: "komputer", name: "Komputer & Aksesoris", icon: "laptop", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=160&auto=format&fit=crop&q=80" },
      { id: "hp", name: "Handphone & Aksesoris", icon: "phone", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&auto=format&fit=crop&q=80" },
      { id: "pakaian-pria", name: "Pakaian Pria", icon: "shirt", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=160&auto=format&fit=crop&q=80" },
      { id: "sepatu-pria", name: "Sepatu Pria", icon: "shoe", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80" },
      { id: "tas-pria", name: "Tas Pria", icon: "bag2", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=160&auto=format&fit=crop&q=80" },
      { id: "aksesoris", name: "Aksesoris Fashion", icon: "ring", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=160&auto=format&fit=crop&q=80" },
      { id: "jam-tangan", name: "Jam Tangan", icon: "watch", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=160&auto=format&fit=crop&q=80" },
      { id: "kesehatan", name: "Kesehatan", icon: "health", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=160&auto=format&fit=crop&q=80" },
      { id: "hobi", name: "Hobi & Koleksi", icon: "game", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=160&auto=format&fit=crop&q=80" },
      { id: "makanan", name: "Makanan & Minuman", icon: "food", image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=160&auto=format&fit=crop&q=80" },
      { id: "kecantikan", name: "Perawatan & Kecantikan", icon: "beauty", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=160&auto=format&fit=crop&q=80" },
      { id: "rumah", name: "Perlengkapan Rumah", icon: "home", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=160&auto=format&fit=crop&q=80" },
      { id: "pakaian-wanita", name: "Pakaian Wanita", icon: "dress", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=160&auto=format&fit=crop&q=80" },
      { id: "fashion-muslim", name: "Fashion Muslim", icon: "moon", image: "https://images.unsplash.com/photo-1585728748178-577629505238?w=160&auto=format&fit=crop&q=80" },
      { id: "fashion-bayi", name: "Fashion Bayi & Anak", icon: "baby", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=160&auto=format&fit=crop&q=80" },
      { id: "ibu-bayi", name: "Ibu & Bayi", icon: "baby", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=160&auto=format&fit=crop&q=80" },
      { id: "sepatu-wanita", name: "Sepatu Wanita", icon: "heel", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=160&auto=format&fit=crop&q=80" },
      { id: "tas-wanita", name: "Tas Wanita", icon: "handbag", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=160&auto=format&fit=crop&q=80" },
      { id: "otomotif", name: "Otomotif", icon: "moto", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=160&auto=format&fit=crop&q=80" }
    ];
  },

  getFallbackProducts() {
    return [
      {
        id: "prod-1",
        name: "DJI Osmo Action 4 Standard Combo 4K/120fps",
        price: 3940000,
        originalPrice: 4899000,
        discountPercent: 20,
        rating: 4.9,
        soldCount: 1420,
        category: "Fotografi",
        location: "Jakarta Barat",
        shopName: "DJI Official Store",
        shopType: "Mall",
        icon: "cam",
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80",
        isFlashSale: true,
        flashSaleSold: 85,
        description: "Kamera aksi dengan sensor besar 1/1.3 inci, tahan air hingga 18 meter tanpa case."
      },
      {
        id: "prod-2",
        name: "iPhone 12 256GB Garansi Resmi iBox Indonesia",
        price: 3599000,
        originalPrice: 4500000,
        discountPercent: 20,
        rating: 4.8,
        soldCount: 980,
        category: "HP & Aksesoris",
        location: "Jakarta Selatan",
        shopName: "Apple Authorized Store",
        shopType: "Mall",
        icon: "phone",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=80",
        isFlashSale: true,
        flashSaleSold: 92,
        description: "Layar Super Retina XDR 6.1 inci yang indah. Bertenaga chip A14 Bionic."
      },
      {
        id: "prod-3",
        name: "Smartwatch Ultra Series 9 Titanium Smart Fitness",
        price: 489000,
        originalPrice: 799000,
        discountPercent: 39,
        rating: 4.7,
        soldCount: 3120,
        category: "Jam Tangan",
        location: "Kota Surabaya",
        shopName: "TechWear ID",
        shopType: "Star+",
        icon: "watch",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
        isFlashSale: true,
        flashSaleSold: 78,
        description: "Jam tangan pintar dengan bodi titanium kokoh dan layar AMOLED HD."
      },
      {
        id: "prod-4",
        name: "Insta360 X4 Kamera 360° 8K Ultra Waterproof",
        price: 6990000,
        originalPrice: 7999000,
        discountPercent: 12,
        rating: 5.0,
        soldCount: 450,
        category: "Fotografi",
        location: "Jakarta Pusat",
        shopName: "Action Cam Center",
        shopType: "Mall",
        icon: "c360",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80",
        isFlashSale: true,
        flashSaleSold: 65,
        description: "Video 8K 360 derajat yang luar biasa jelas dengan stabilisasi FlowState."
      },
      {
        id: "prod-5",
        name: "Earbuds Wireless Pro Active Noise Cancelling ANC",
        price: 147250,
        originalPrice: 299000,
        discountPercent: 50,
        rating: 4.8,
        soldCount: 5400,
        category: "Elektronik",
        location: "Kota Bandung",
        shopName: "AudioMax Indonesia",
        shopType: "Star+",
        icon: "head",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80",
        isFlashSale: true,
        flashSaleSold: 95,
        description: "Suara jernih dengan peredam kebisingan aktif dan latensi ultra rendah."
      },
      {
        id: "prod-6",
        name: "MacBook Air M2 13 inci 256GB SSD Midnight",
        price: 14999000,
        originalPrice: 17299000,
        discountPercent: 13,
        rating: 4.9,
        soldCount: 310,
        category: "Komputer & Aksesoris",
        location: "Jakarta Barat",
        shopName: "iStore Official",
        shopType: "Mall",
        icon: "laptop",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80",
        isFlashSale: true,
        flashSaleSold: 60,
        description: "Bertenaga chip M2 generasi berikutnya dalam bodi tipis elegan."
      },
      {
        id: "prod-7",
        name: "Sneakers Pria Casual Streetwear Black White Sporty",
        price: 255000,
        originalPrice: 380000,
        discountPercent: 33,
        rating: 4.7,
        soldCount: 2890,
        category: "Sepatu Pria",
        location: "Kota Bandung",
        shopName: "FootStyle Original",
        shopType: "Star",
        icon: "shoe",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80",
        isFlashSale: true,
        flashSaleSold: 88,
        description: "Sepatu sneakers kasual dengan sol karet elastis anti-slip."
      },
      {
        id: "prod-8",
        name: "Serum Wajah Brightening 10% Niacinamide Glow",
        price: 89000,
        originalPrice: 135000,
        discountPercent: 34,
        rating: 4.9,
        soldCount: 12400,
        category: "Perawatan & Kecantikan",
        location: "Jakarta Utara",
        shopName: "GlowBeauty Official",
        shopType: "Mall",
        icon: "serum",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80",
        isFlashSale: true,
        flashSaleSold: 99,
        description: "Serum pencerah kulit dengan ekstrak alami melembapkan wajah."
      }
    ];
  },

  renderHomeQuickNav() {
    const qkEl = document.getElementById('qk');
    if (!qkEl) return;

    const quickServices = [
      { icon: "heart", label: "Pasarin Pilih Lokal", color: "#e11d48", bg: "#ffe4e6" },
      { icon: "mall", label: "Pasarin Mall", color: "#1d3f0d", bg: "#ecfdf5" },
      { icon: "phone", label: "Pulsa & Tagihan", color: "#0284c7", bg: "#e0f2fe" },
      { icon: "bolt", label: "Flash Sale", color: "#ea580c", bg: "#fff7ed" },
      { icon: "market", label: "Pasarin Mart", color: "#16a34a", bg: "#f0fdf4" },
      { icon: "truck", label: "Dikelola Pasarin", color: "#d97706", bg: "#fef3c7" },
      { icon: "shirt", label: "FitCheck Diskon 25%", color: "#db2777", bg: "#fdf2f8" },
      { icon: "ticket", label: "Gratis Ongkir & Voucher", color: "#0d9488", bg: "#f0fdfa" },
      { icon: "moon", label: "Pasarin Barokah", color: "#059669", bg: "#ecfdf5" },
      { icon: "tag", label: "Semua Promo", color: "#dc2626", bg: "#fef2f2" }
    ];

    qkEl.innerHTML = quickServices.map(item => {
      const isPromo = item.label === 'Semua Promo';
      const hrefAttr = isPromo ? 'javascript:void(0)' : `#/search?q=${encodeURIComponent(item.label)}`;
      const clickAttr = isPromo ? 'onclick="PasarinApp.openPromoModal()"' : '';

      return `
        <a href="${hrefAttr}" ${clickAttr} class="qk-item">
          <div class="qk-circle" style="background: ${item.bg}; color: ${item.color};">
            ${this.renderIcon(item.icon, 'i')}
          </div>
          <span class="qk-label">${item.label}</span>
        </a>
      `;
    }).join('');
  },

  renderHomeCategories() {
    const catsEl = document.getElementById('cats');
    if (!catsEl) return;

    catsEl.innerHTML = this.categories.map(c => {
      const imgHtml = c.image ? `
        <div class="cat-img-wrap">
          <img src="${c.image}" alt="${c.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="cat-icon-fallback" style="display: none;">
            ${this.renderIcon(c.icon || 'bag', 'i')}
          </div>
        </div>
      ` : `
        <div class="cat-img-wrap">
          <div class="cat-icon-fallback">
            ${this.renderIcon(c.icon || 'bag', 'i')}
          </div>
        </div>
      `;

      return `
        <a href="#/search?category=${encodeURIComponent(c.name)}" class="cat-tile" title="${c.name}">
          ${imgHtml}
          <div class="cat-name">${c.name}</div>
        </a>
      `;
    }).join('');
  },

  renderFlashSale(items) {
    const fsEl = document.getElementById('fs');
    if (!fsEl) return;

    fsEl.innerHTML = items.slice(0, 6).map(p => `
      <div class="fc" onclick="PasarinApp.openProductDetail('${p.id}')">
        ${p.discountPercent ? `<span class="fc-discount-tag">-${p.discountPercent}%</span>` : ''}
        <div class="pic">
          ${this.renderProductMedia(p, 'i lg')}
          <button class="btn-quick-cart" onclick="event.stopPropagation(); if(window.PasarinCart) window.PasarinCart.addToCart('${p.id}', 1);" title="Tambah ke Keranjang" aria-label="Tambah ke Keranjang">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
        <div class="fc-title">${p.name}</div>
        <div class="pr">${this.formatRupiah(p.price)}</div>
        ${p.originalPrice ? `<div class="original-pr">${this.formatRupiah(p.originalPrice)}</div>` : ''}
        <div class="bar" style="--p:${p.flashSaleSold || 80}%">
          <i></i>
          <em>${p.flashSaleSold > 90 ? 'Segera Habis' : 'Terjual ' + (p.soldCount || 100)}</em>
        </div>
      </div>
    `).join('');
  },

  renderHomeGrid() {
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;

    gridEl.innerHTML = this.products.map((p, i) => {
      const badgeClass = p.shopType === 'Mall' ? 'badge-mall' : p.shopType === 'Star+' ? 'badge-star-plus' : 'badge-star';
      const rankLabel = i === 0 ? '👑 TOP 1' : i === 1 ? '🥈 TOP 2' : i === 2 ? '🥉 TOP 3' : 'TOP ' + (i + 1);

      return `
        <div class="cd" onclick="PasarinApp.openProductDetail('${p.id}')">
          <!-- Top Badges Overlay -->
          <div class="cd-badges-top">
            ${i < 4 ? `<span class="badge-top-rank">${rankLabel}</span>` : (p.isFlashSale ? '<span class="badge-hot">⚡ HOT</span>' : '')}
            ${p.discountPercent ? `<span class="badge-discount">-${p.discountPercent}%</span>` : ''}
          </div>

          <!-- Product Image Container -->
          <div class="pic">
            ${this.renderProductMedia(p, 'i lg')}
            <button class="btn-quick-cart" onclick="event.stopPropagation(); if(window.PasarinCart) window.PasarinCart.addToCart('${p.id}', 1);" title="Tambah ke Keranjang" aria-label="Tambah ke Keranjang">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </div>

          <!-- Content Body -->
          <div class="in">
            <h4 title="${p.name}">
              <span class="shop-badge ${badgeClass}">${p.shopType || 'Mall'}</span>
              ${p.name}
            </h4>

            <div class="trust-tags">
              <span class="trust-tag gratis-ongkir">🚚 Bebas Ongkir</span>
              ${p.price < 5000000 ? '<span class="trust-tag cod">COD</span>' : ''}
            </div>

            <div class="price-container">
              <div class="pr"><span class="currency">Rp</span>${Number(p.price).toLocaleString('id-ID')}</div>
              ${p.originalPrice && p.originalPrice > p.price ? `
                <div class="price-original-row">
                  <span class="original-price">Rp${Number(p.originalPrice).toLocaleString('id-ID')}</span>
                  <span class="disc-pill">-${p.discountPercent || Math.round((1 - p.price / p.originalPrice) * 100)}%</span>
                </div>
              ` : ''}
            </div>

            <div class="ft">
              <div class="rating-sold">
                <span class="star-rating">★ ${p.rating || 4.9}</span>
                <span class="sold-dot">•</span>
                <span class="sold-count">${this.formatSoldCount(p.soldCount || 50)}</span>
              </div>
              <div class="location-tag">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span class="loc-text">${p.location || 'Indonesia'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  initTimer() {
    const tm = document.getElementById('tm');
    if (!tm) return;
    let endTime = Date.now() + (1 * 3600 + 30 * 60 + 35) * 1000;
    setInterval(() => {
      let remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      let pad = n => String(n).padStart(2, '0');
      let h = Math.floor(remaining / 3600);
      let m = Math.floor((remaining % 3600) / 60);
      let s = remaining % 60;
      tm.innerHTML = `<span class="tm-digit">${pad(h)}</span><span class="tm-colon">:</span><span class="tm-digit">${pad(m)}</span><span class="tm-colon">:</span><span class="tm-digit">${pad(s)}</span>`;
    }, 1000);
  },

  /* ---------- ROUTER ---------- */
  route() {
    const hash = window.location.hash || '#/';
    const isSearch = hash.startsWith('#/search');
    const isCart = hash === '#/cart';
    const isCheckout = hash === '#/checkout';
    const isOrders = hash === '#/orders';

    const homeView = document.getElementById('view-home');
    const searchView = document.getElementById('view-search');
    const cartView = document.getElementById('view-cart');
    const checkoutView = document.getElementById('view-checkout');
    const headerEl = document.querySelector('.hd');
    const cartHeaderTitle = document.getElementById('cart-header-title');
    const cartIconBtn = document.querySelector('.hd .cart');
    const searchSuggestions = document.querySelector('.hd .sb .sg');

    if (isCart) {
      if (homeView) homeView.classList.remove('active');
      if (searchView) searchView.classList.remove('active');
      if (checkoutView) checkoutView.classList.remove('active');
      if (cartView) cartView.classList.add('active');
      if (headerEl) headerEl.classList.add('hd-cart-mode');
      if (cartHeaderTitle) {
        cartHeaderTitle.style.display = 'flex';
        const txt = cartHeaderTitle.querySelector('.cart-header-text');
        if (txt) txt.textContent = 'Keranjang Saya';
      }
      if (cartIconBtn) cartIconBtn.style.display = 'none';
      if (searchSuggestions) searchSuggestions.style.display = 'none';
      document.title = 'Keranjang Belanja | Pasarin';
      if (window.PasarinCart) window.PasarinCart.renderCartPage();
    } else if (isCheckout) {
      if (homeView) homeView.classList.remove('active');
      if (searchView) searchView.classList.remove('active');
      if (cartView) cartView.classList.remove('active');
      if (checkoutView) checkoutView.classList.add('active');
      if (headerEl) headerEl.classList.add('hd-cart-mode');
      if (cartHeaderTitle) {
        cartHeaderTitle.style.display = 'flex';
        const txt = cartHeaderTitle.querySelector('.cart-header-text');
        if (txt) txt.textContent = 'Checkout';
      }
      if (cartIconBtn) cartIconBtn.style.display = 'none';
      if (searchSuggestions) searchSuggestions.style.display = 'none';
      document.title = 'Checkout | Pasarin';
      if (window.PasarinCart) window.PasarinCart.renderCheckoutPage();
    } else if (isSearch) {
      if (homeView) homeView.classList.remove('active');
      if (cartView) cartView.classList.remove('active');
      if (checkoutView) checkoutView.classList.remove('active');
      if (searchView) searchView.classList.add('active');
      if (headerEl) headerEl.classList.remove('hd-cart-mode');
      if (cartHeaderTitle) cartHeaderTitle.style.display = 'none';
      if (cartIconBtn) cartIconBtn.style.display = 'flex';
      if (searchSuggestions) searchSuggestions.style.display = 'flex';
      document.title = 'Hasil Pencarian | Pasarin';
      this.handleSearchRoute();
    } else {
      if (searchView) searchView.classList.remove('active');
      if (cartView) cartView.classList.remove('active');
      if (checkoutView) checkoutView.classList.remove('active');
      if (homeView) homeView.classList.add('active');
      if (headerEl) headerEl.classList.remove('hd-cart-mode');
      if (cartHeaderTitle) cartHeaderTitle.style.display = 'none';
      if (cartIconBtn) cartIconBtn.style.display = 'flex';
      if (searchSuggestions) searchSuggestions.style.display = 'flex';
      document.title = 'Pasarin Indonesia | Belanja Cerdas & Terpercaya';
    }

    if (isOrders) {
      this.openOrdersModal();
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  handleSearchRoute() {
    const hash = window.location.hash;
    const queryIdx = hash.indexOf('?');
    let q = '';
    let cat = null;

    if (queryIdx > -1) {
      const params = new URLSearchParams(hash.substring(queryIdx));
      q = params.get('q') || '';
      cat = params.get('category') || null;
    }

    this.searchQuery = q;
    this.activeCategory = cat || 'Semua';

    if (q && window.PasarinSearchHistory) {
      window.PasarinSearchHistory.recordSearch(q);
    }

    const searchInput = document.querySelector('#form-home input');
    if (searchInput) searchInput.value = q;

    const querySpan = document.getElementById('search-query-text');
    if (querySpan) querySpan.textContent = q ? `'${q}'` : (cat ? `Kategori '${cat}'` : 'Semua Produk');

    this.applySearchFilter();
  },

  applySearchFilter() {
    let list = [...this.products];

    // Filter keyword
    if (this.searchQuery && this.searchQuery.trim()) {
      const kw = this.searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(kw) ||
        (p.category && p.category.toLowerCase().includes(kw)) ||
        (p.description && p.description.toLowerCase().includes(kw))
      );
    }

    // Filter Kategori
    if (this.activeCategory && this.activeCategory !== 'Semua') {
      list = list.filter(p => p.category && p.category.toLowerCase() === this.activeCategory.toLowerCase());
    }

    // Filter Rentang Harga
    if (this.priceRange.min !== null) {
      list = list.filter(p => p.price >= this.priceRange.min);
    }
    if (this.priceRange.max !== null) {
      list = list.filter(p => p.price <= this.priceRange.max);
    }

    // Filter Rating
    if (this.selectedRating !== null) {
      list = list.filter(p => (p.rating || 0) >= this.selectedRating);
    }

    // Filter Lokasi
    if (this.selectedLocation) {
      list = list.filter(p => p.location && p.location.toLowerCase().includes(this.selectedLocation.toLowerCase()));
    }

    // Pengurutan
    if (this.activeSort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (this.activeSort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (this.activeSort === 'top_sales') {
      list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    } else if (this.activeSort === 'latest') {
      list.sort((a, b) => b.id.localeCompare(a.id));
    }

    this.renderSearchResults(list);
  },

  renderSearchResults(items) {
    const grid = document.getElementById('search-results-grid');
    if (!grid) return;

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 54px; margin-bottom: 16px;">🔍</div>
          <h3 style="font-size: 18px; font-weight: 800; color: #1e293b;">Tidak ada produk yang cocok</h3>
          <p style="color: #64748b; margin-top: 6px;">Coba gunakan kata kunci lain atau ubah filter harga dan kategori.</p>
          <button class="btn-primary" style="margin-top: 20px;" onclick="PasarinApp.resetFilters()">Reset Semua Filter</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(p => {
      const badgeClass = p.shopType === 'Mall' ? 'badge-mall' : p.shopType === 'Star+' ? 'badge-star-plus' : 'badge-star';
      return `
        <div class="c" onclick="PasarinApp.openProductDetail('${p.id}')">
          <div class="cd-badges-top">
            ${p.discountPercent ? `<span class="badge-discount">-${p.discountPercent}%</span>` : ''}
          </div>
          <div class="im">
            ${this.renderProductMedia(p, 'i lg')}
            <button class="btn-quick-cart" onclick="event.stopPropagation(); if(window.PasarinCart) window.PasarinCart.addToCart('${p.id}', 1);" title="Tambah ke Keranjang" aria-label="Tambah ke Keranjang">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </div>
          <div class="in">
            <div class="tt" title="${p.name}">
              <span class="shop-badge ${badgeClass}">${p.shopType || 'Mall'}</span>
              ${p.name}
            </div>
            <div class="trust-tags">
              <span class="trust-tag gratis-ongkir">🚚 Bebas Ongkir</span>
            </div>
            <div class="price-container">
              <div class="p"><small>Rp</small>${Number(p.price).toLocaleString('id-ID')}</div>
              ${p.originalPrice && p.originalPrice > p.price ? `
                <div class="price-original-row">
                  <span class="original-price">Rp${Number(p.originalPrice).toLocaleString('id-ID')}</span>
                  <span class="disc-pill">-${p.discountPercent || Math.round((1 - p.price / p.originalPrice) * 100)}%</span>
                </div>
              ` : ''}
            </div>
            <div class="ft">
              <div class="rating-sold">
                <span class="star-rating">★ ${p.rating || 4.9}</span>
                <span class="sold-dot">•</span>
                <span class="sold-count">${this.formatSoldCount(p.soldCount || 10)}</span>
              </div>
              <div class="location-tag">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span class="loc-text">${p.location || 'Indonesia'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  resetFilters() {
    this.priceRange = { min: null, max: null };
    this.selectedRating = null;
    this.selectedLocation = null;
    this.activeCategory = 'Semua';
    this.activeSort = 'relevance';

    const minInput = document.getElementById('price-min-input');
    const maxInput = document.getElementById('price-max-input');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';

    this.applySearchFilter();
  },

  /* ---------- MODAL DETAIL PRODUK ---------- */
  openProductDetail(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const modalId = 'product-detail-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'pasarin-modal-overlay';
      document.body.appendChild(modal);
    }

    const discountMarkup = product.discountPercent ? `
      <div class="detail-discount-badge">Hemat ${product.discountPercent}%</div>
      <div class="detail-original-price">Rp${Number(product.originalPrice).toLocaleString('id-ID')}</div>
    ` : '';

    modal.innerHTML = `
      <div class="pasarin-modal-card modal-detail-card">
        <button class="pasarin-modal-close" onclick="document.getElementById('${modalId}').classList.remove('active')">&times;</button>
        <div class="detail-content-wrap">
          <div class="detail-left">
            <div class="detail-img-box">
              ${this.renderProductMedia(product, 'i huge')}
            </div>
            <div class="detail-badges">
              <span class="badge-tag">✓ 100% Original</span>
              <span class="badge-tag">🚚 Bebas Ongkir</span>
              <span class="badge-tag">🛡️ Garansi Resmi</span>
            </div>
          </div>
          <div class="detail-right">
            <span class="detail-shop-tag">${product.shopType || 'Mall'} · ${product.shopName || 'Pasarin Partner'}</span>
            <h2 class="detail-title">${product.name}</h2>
            <div class="detail-rating-row">
              <span class="rating-stars">★★★★★</span>
              <strong>${product.rating || 4.9}</strong>
              <span class="dot-sep">•</span>
              <span>${product.soldCount || 100}+ Terjual</span>
              <span class="dot-sep">•</span>
              <span>📍 ${product.location || 'Indonesia'}</span>
            </div>

            <div class="detail-price-box">
              ${discountMarkup}
              <div class="detail-price-now">
                <small>Rp</small>${Number(product.price).toLocaleString('id-ID')}
              </div>
            </div>

            <div class="detail-desc-box">
              <h4>Deskripsi Produk:</h4>
              <p>${product.description || 'Produk kualitas terbaik dengan garansi terpercaya di Pasarin.'}</p>
              ${product.specs ? `
                <ul class="detail-specs-list">
                  ${product.specs.map(s => `<li>${s}</li>`).join('')}
                </ul>
              ` : ''}
            </div>

            <div class="detail-qty-row" style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
              <span style="font-weight:600;">Jumlah:</span>
              <div class="qty-stepper">
                <button class="qty-btn" id="modal-qty-minus">-</button>
                <input class="qty-input" id="modal-qty-input" type="text" value="1" readonly>
                <button class="qty-btn" id="modal-qty-plus">+</button>
              </div>
              <small style="color: #64748b;">Tersisa ${product.stock || 25} buah</small>
            </div>

            <div class="detail-actions">
              <button class="btn-add-cart" id="modal-btn-add-cart">
                ${this.renderIcon('cart', 'i')} Masukkan Keranjang
              </button>
              <button class="btn-buy-now" id="modal-btn-buy-now">
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    let qty = 1;
    const qtyInput = modal.querySelector('#modal-qty-input');
    modal.querySelector('#modal-qty-minus').onclick = () => {
      if (qty > 1) {
        qty--;
        qtyInput.value = qty;
      }
    };
    modal.querySelector('#modal-qty-plus').onclick = () => {
      if (qty < (product.stock || 99)) {
        qty++;
        qtyInput.value = qty;
      }
    };

    modal.querySelector('#modal-btn-add-cart').onclick = () => {
      if (window.PasarinCart) {
        window.PasarinCart.addToCart(product.id, qty);
      }
      modal.classList.remove('active');
    };

    modal.querySelector('#modal-btn-buy-now').onclick = async () => {
      if (window.PasarinCart) {
        await window.PasarinCart.addToCart(product.id, qty);
        modal.classList.remove('active');
        window.PasarinCart.handleCheckoutClick();
      }
    };

    modal.classList.add('active');
  },

  /* ---------- MODAL RIWAYAT PESANAN ---------- */
  async openOrdersModal() {
    const modalId = 'orders-history-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'pasarin-modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="pasarin-modal-card" style="max-width: 650px;">
        <div class="pasarin-modal-header">
          <h3>Riwayat Pesanan Saya</h3>
          <button class="pasarin-modal-close" onclick="document.getElementById('${modalId}').classList.remove('active')">&times;</button>
        </div>
        <div class="pasarin-modal-body" id="orders-modal-body">
          <div style="text-align: center; padding: 30px;">Memuat riwayat pesanan...</div>
        </div>
      </div>
    `;
    modal.classList.add('active');

    const res = await PasarinAPI.getMyOrders();
    const body = modal.querySelector('#orders-modal-body');

    if (res && res.success && res.data && res.data.length > 0) {
      body.innerHTML = res.data.map(ord => `
        <div class="order-history-card">
          <div class="order-header-line">
            <span><strong>No. Pesanan:</strong> ${ord.id}</span>
            <span class="badge-status">${ord.status}</span>
          </div>
          <div class="order-items-list">
            ${ord.items.map(it => `
              <div class="order-item-row">
                <span>${it.name} (${it.quantity}x)</span>
                <strong>${this.formatRupiah(it.price * it.quantity)}</strong>
              </div>
            `).join('')}
          </div>
          <div class="order-footer-line">
            <small>Metode: ${ord.paymentMethod} • ${new Date(ord.createdAt).toLocaleDateString('id-ID')}</small>
            <div>Total: <strong style="color:var(--primary); font-size:15px;">${this.formatRupiah(ord.totalAmount)}</strong></div>
          </div>
        </div>
      `).join('');
    } else {
      body.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 40px; margin-bottom: 12px;">📦</div>
          <h4>Belum Ada Pesanan</h4>
          <p style="color: #64748b;">Pesanan yang Anda buat akan muncul di sini.</p>
        </div>
      `;
    }
  },

  /* ---------- MODAL KELOLA PRODUK & PROMO (KANAL PENJUAL) ---------- */
  activeCrudTab: 'products',

  async openProductCrudModal(tab = 'products') {
    this.activeCrudTab = tab;
    const modalId = 'product-crud-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'pasarin-modal-overlay';
      document.body.appendChild(modal);
    }

    const isProducts = this.activeCrudTab === 'products';

    modal.innerHTML = `
      <div class="pasarin-modal-card" style="max-width: 920px; width: 95%;">
        <div class="pasarin-modal-header" style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="background:var(--primary); color:#fff; width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:18px;">⚙️</span>
            <div>
              <h3 style="margin:0; font-size:16px;">Kanal Penjual & Admin Pasarin</h3>
              <small style="color:#64748b;">Kelola katalog produk dan buat sistem kode promo sendiri (Database SQL)</small>
            </div>
          </div>
          <button class="pasarin-modal-close" onclick="document.getElementById('${modalId}').classList.remove('active')">&times;</button>
        </div>

        <!-- Tab Navigasi CRUD -->
        <div style="display: flex; background: #fff; border-bottom: 2px solid #f1f5f9; padding: 0 24px;">
          <button type="button" onclick="PasarinApp.openProductCrudModal('products')" style="padding: 14px 20px; font-weight: 700; font-size: 13px; border: none; background: transparent; cursor: pointer; border-bottom: 3px solid ${isProducts ? 'var(--primary)' : 'transparent'}; color: ${isProducts ? 'var(--primary)' : '#64748b'};">
            📦 Kelola Produk (${this.products.length})
          </button>
          <button type="button" onclick="PasarinApp.openProductCrudModal('promos')" style="padding: 14px 20px; font-weight: 700; font-size: 13px; border: none; background: transparent; cursor: pointer; border-bottom: 3px solid ${!isProducts ? 'var(--primary)' : 'transparent'}; color: ${!isProducts ? 'var(--primary)' : '#64748b'};">
            🏷️ Kelola & Buat Kode Promo (${this.promos.length})
          </button>
        </div>

        ${isProducts ? `
          <!-- PANEL PRODUK -->
          <div style="padding: 16px 24px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9;">
            <div style="font-weight:600; color:#334155;">Daftar Produk: <span id="crud-total-count">${this.products.length}</span> item aktif</div>
            <button class="btn-primary" onclick="PasarinApp.openProductFormModal()" style="display:inline-flex; align-items:center; gap:6px; padding:8px 16px; font-size:13px;">
              <span>+</span> Tambah Produk Baru
            </button>
          </div>

          <div class="pasarin-modal-body" style="padding: 16px 24px; max-height: 55vh; overflow-y: auto;">
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                    <th style="padding: 10px 12px;">Foto</th>
                    <th style="padding: 10px 12px;">Nama Produk</th>
                    <th style="padding: 10px 12px;">Kategori</th>
                    <th style="padding: 10px 12px;">Harga</th>
                    <th style="padding: 10px 12px;">Stok</th>
                    <th style="padding: 10px 12px; text-align: center;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="crud-product-tbody">
                  ${this.products.map(p => `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                      <td style="padding: 10px 12px; width: 60px;">
                        <div style="width: 48px; height: 48px; border-radius: 6px; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center;">
                          ${this.renderProductMedia(p, 'i')}
                        </div>
                      </td>
                      <td style="padding: 10px 12px; font-weight: 600; color: #1e293b; max-width: 250px;">
                        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                        <small style="color: #64748b; font-weight: normal;">${p.shopName || 'Pasarin Partner'} • ${p.location || 'Indonesia'}</small>
                      </td>
                      <td style="padding: 10px 12px; color: #475569;">
                        <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${p.category}</span>
                      </td>
                      <td style="padding: 10px 12px; font-weight: 700; color: var(--primary);">
                        ${this.formatRupiah(p.price)}
                      </td>
                      <td style="padding: 10px 12px; color: #475569;">
                        ${p.stock || 0} unit
                      </td>
                      <td style="padding: 10px 12px; text-align: center; white-space: nowrap;">
                        <button onclick="PasarinApp.openProductFormModal('${p.id}')" style="background:#e0f2fe; color:#0284c7; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:600; margin-right:6px;">
                          ✏️ Edit
                        </button>
                        <button onclick="PasarinApp.deleteProduct('${p.id}')" style="background:#fee2e2; color:#dc2626; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:600;">
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <!-- PANEL KELOLA KODE PROMO -->
          <div style="padding: 16px 24px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9;">
            <div>
              <div style="font-weight:700; color:#1e293b; font-size:14px;">Daftar Kode Promo Aktif</div>
              <small style="color:#64748b;">Kode promo ini dapat langsung diinput oleh pembeli saat checkout belanja.</small>
            </div>
            <button class="btn-primary" onclick="PasarinApp.openPromoFormModal()" style="display:inline-flex; align-items:center; gap:6px; padding:8px 16px; font-size:13px;">
              <span>+</span> Buat Kode Promo Baru
            </button>
          </div>

          <div class="pasarin-modal-body" style="padding: 16px 24px; max-height: 55vh; overflow-y: auto;">
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                    <th style="padding: 10px 12px;">Kode Promo</th>
                    <th style="padding: 10px 12px;">Judul Promo</th>
                    <th style="padding: 10px 12px;">Nilai Diskon</th>
                    <th style="padding: 10px 12px;">Min. Belanja</th>
                    <th style="padding: 10px 12px;">Kategori</th>
                    <th style="padding: 10px 12px; text-align: center;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="crud-promo-tbody">
                  ${this.promos.map(pr => `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                      <td style="padding: 10px 12px;">
                        <span style="font-family: monospace; font-weight: 800; background: #fff1f2; color: #e11d48; padding: 3px 8px; border-radius: 4px; border: 1px solid #fecdd3;">
                          ${pr.code}
                        </span>
                      </td>
                      <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">
                        ${pr.title}
                        <div style="font-size: 11px; color: #64748b; font-weight: normal;">${pr.desc || ''}</div>
                      </td>
                      <td style="padding: 10px 12px; font-weight: 700; color: var(--primary);">
                        ${pr.valText}
                      </td>
                      <td style="padding: 10px 12px; color: #475569;">
                        ${pr.minSpend}
                      </td>
                      <td style="padding: 10px 12px;">
                        <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">
                          ${pr.category || 'diskon'}
                        </span>
                      </td>
                      <td style="padding: 10px 12px; text-align: center; white-space: nowrap;">
                        <button onclick="PasarinApp.copyPromoCode('${pr.code}')" style="background:#f1f5f9; color:#475569; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:600; margin-right:6px;">
                          📋 Salin
                        </button>
                        <button onclick="PasarinApp.deletePromoCode('${pr.code}')" style="background:#fee2e2; color:#dc2626; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:600;">
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;

    modal.classList.add('active');
  },

  /* Modal Form Pembuatan Kode Promo Baru Sendiri */
  openPromoFormModal() {
    const modalId = 'promo-form-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'pasarin-modal-overlay';
      modal.style.zIndex = '2700';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="pasarin-modal-card" style="max-width: 540px;">
        <div class="pasarin-modal-header" style="background:#f8fafc;">
          <h3 style="margin:0; font-size:16px;">Buat Kode Promo Baru Sendiri</h3>
          <button class="pasarin-modal-close" onclick="document.getElementById('${modalId}').classList.remove('active')">&times;</button>
        </div>

        <form id="form-create-custom-promo" style="padding: 20px;">
          <div style="margin-bottom: 14px;">
            <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Kode Promo (Ketik Huruf Kapital & Angka) *</label>
            <input type="text" id="cp-code" class="pasarin-input" placeholder="contoh: MERDEKA50, HEMAT2026, FERDI100" required style="text-transform: uppercase; font-family: monospace; font-weight: 800; letter-spacing: 1px;">
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Judul / Nama Promo *</label>
            <input type="text" id="cp-title" class="pasarin-input" placeholder="contoh: Diskon Spesial Pengguna Baru 50%" required>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom: 14px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Tipe Diskon *</label>
              <select id="cp-type" class="pasarin-input" style="padding: 9px;">
                <option value="percent">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Nilai Diskon *</label>
              <input type="number" id="cp-val" class="pasarin-input" placeholder="contoh: 20 atau 50000" min="1" required>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom: 14px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Min. Belanja (Rp)</label>
              <input type="number" id="cp-min-spend" class="pasarin-input" placeholder="0 jika tanpa min. belanja" value="0">
            </div>
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Maks. Diskon (Rp)</label>
              <input type="number" id="cp-max-disc" class="pasarin-input" placeholder="contoh: 100000">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom: 14px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Kategori Promo</label>
              <select id="cp-category" class="pasarin-input" style="padding: 9px;">
                <option value="diskon">🏷️ Diskon Belanja</option>
                <option value="ongkir">🚚 Gratis Ongkir</option>
                <option value="cashback">💰 Cashback Koin</option>
                <option value="lokal">🇮🇩 Brand Lokal UMKM</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Kuota Penggunaan</label>
              <input type="number" id="cp-quota" class="pasarin-input" placeholder="100" value="100" min="1">
            </div>
          </div>

          <div style="margin-bottom: 18px;">
            <label style="display:block; font-size:12px; font-weight:700; margin-bottom:6px;">Keterangan Singkat</label>
            <input type="text" id="cp-desc" class="pasarin-input" placeholder="contoh: Diskon berlaku untuk semua produk pilihan.">
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn-secondary" onclick="document.getElementById('${modalId}').classList.remove('active')">Batal</button>
            <button type="submit" class="btn-primary" id="btn-save-custom-promo">Simpan & Aktifkan Promo</button>
          </div>
        </form>
      </div>
    `;

    const form = modal.querySelector('#form-create-custom-promo');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const saveBtn = modal.querySelector('#btn-save-custom-promo');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Menyimpan...';

      const payload = {
        code: modal.querySelector('#cp-code').value.trim().toUpperCase(),
        title: modal.querySelector('#cp-title').value.trim(),
        description: modal.querySelector('#cp-desc').value.trim(),
        discount_type: modal.querySelector('#cp-type').value,
        discount_value: Number(modal.querySelector('#cp-val').value),
        min_spend: Number(modal.querySelector('#cp-min-spend').value || 0),
        max_discount: modal.querySelector('#cp-max-disc').value ? Number(modal.querySelector('#cp-max-disc').value) : null,
        quota: Number(modal.querySelector('#cp-quota').value || 100),
        category: modal.querySelector('#cp-category').value
      };

      const res = await PasarinAPI.createPromo(payload);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Simpan & Aktifkan Promo';

      if (res && res.success) {
        if (window.showToast) window.showToast(`✓ Promo "${payload.code}" berhasil dibuat!`, 'success');
        modal.classList.remove('active');
        await this.loadInitialData();
        this.openProductCrudModal('promos');
      } else {
        if (window.showToast) window.showToast(res ? res.message : 'Gagal membuat kode promo.', 'error');
      }
    };

    modal.classList.add('active');
  },

  /* Hapus Kode Promo */
  async deletePromoCode(code) {
    if (!confirm(`Hapus kode promo "${code}" dari database?`)) return;

    const res = await PasarinAPI.deletePromo(code);
    if (res && res.success) {
      if (window.showToast) window.showToast(res.message, 'info');
      await this.loadInitialData();
      this.openProductCrudModal('promos');
    } else {
      if (window.showToast) window.showToast(res ? res.message : 'Gagal menghapus kode promo.', 'error');
    }
  },

  /* Form Tambah / Edit Produk */
  openProductFormModal(productId = null) {
    const isEdit = Boolean(productId);
    const p = isEdit ? this.products.find(x => x.id === productId) : null;

    const modalId = 'product-form-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'pasarin-modal-overlay';
      modal.style.zIndex = '2600';
      document.body.appendChild(modal);
    }

    const categoriesList = [
      "Elektronik", "Komputer & Aksesoris", "HP & Aksesoris", "Fotografi",
      "Pakaian Pria", "Sepatu Pria", "Tas Pria", "Jam Tangan", "Kesehatan",
      "Hobi & Koleksi", "Makanan & Minuman", "Perawatan & Kecantikan",
      "Perlengkapan Rumah", "Pakaian Wanita", "Fashion Muslim", "Otomotif"
    ];

    modal.innerHTML = `
      <div class="pasarin-modal-card" style="max-width: 600px;">
        <div class="pasarin-modal-header" style="background:#f8fafc;">
          <h3>${isEdit ? 'Edit Produk (Update)' : 'Tambah Produk Baru (Create)'}</h3>
          <button class="pasarin-modal-close" onclick="document.getElementById('${modalId}').classList.remove('active')">&times;</button>
        </div>

        <form id="form-product-crud" style="padding: 20px;">
          <input type="hidden" id="crud-id" value="${p ? p.id : ''}">

          <div style="margin-bottom: 14px;">
            <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">Nama Produk *</label>
            <input type="text" id="crud-name" class="pasarin-input" required value="${p ? p.name : ''}" placeholder="contoh: DJI Osmo Action 4 Combo" style="margin-top:0;">
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">Kategori *</label>
              <select id="crud-category" class="pasarin-input" style="margin-top:0; height:38px;">
                ${categoriesList.map(cat => `
                  <option value="${cat}" ${p && p.category === cat ? 'selected' : ''}>${cat}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">Stok Barang *</label>
              <input type="number" id="crud-stock" class="pasarin-input" required value="${p ? p.stock : 25}" style="margin-top:0;" min="1">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">Harga Jual (Rp) *</label>
              <input type="number" id="crud-price" class="pasarin-input" required value="${p ? p.price : ''}" placeholder="contoh: 3940000" style="margin-top:0;" min="1000">
            </div>
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">Harga Asli / Coret (Rp)</label>
              <input type="number" id="crud-original-price" class="pasarin-input" value="${p && p.originalPrice ? p.originalPrice : ''}" placeholder="contoh: 4899000" style="margin-top:0;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">Lokasi Toko</label>
              <input type="text" id="crud-location" class="pasarin-input" value="${p ? p.location : 'Jakarta Barat'}" style="margin-top:0;">
            </div>
            <div>
              <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">Nama Toko</label>
              <input type="text" id="crud-shop" class="pasarin-input" value="${p ? p.shopName : 'Pasarin Official'}" style="margin-top:0;">
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">URL Gambar Produk (Online CDN / Image Link)</label>
            <input type="url" id="crud-image" class="pasarin-input" value="${p && p.image ? p.image : ''}" placeholder="https://images.unsplash.com/..." style="margin-top:0;">
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; cursor:pointer;">
              <input type="checkbox" id="crud-flashsale" ${p && p.isFlashSale ? 'checked' : ''}>
              <span>Tampilkan di Bagian <b>⚡ Flash Sale</b></span>
            </label>
          </div>

          <div style="margin-bottom: 18px;">
            <label style="display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#334155;">Deskripsi Produk</label>
            <textarea id="crud-desc" class="pasarin-input" rows="3" placeholder="Jelaskan keunggulan dan spesifikasi produk..." style="margin-top:0;">${p ? (p.description || '') : ''}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn-secondary" onclick="document.getElementById('${modalId}').classList.remove('active')">Batal</button>
            <button type="submit" class="btn-primary" id="btn-save-crud-product">${isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}</button>
          </div>
        </form>
      </div>
    `;

    const form = modal.querySelector('#form-product-crud');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const saveBtn = modal.querySelector('#btn-save-crud-product');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Menyimpan ke Database...';

      const payload = {
        name: modal.querySelector('#crud-name').value.trim(),
        category: modal.querySelector('#crud-category').value,
        price: Number(modal.querySelector('#crud-price').value),
        originalPrice: Number(modal.querySelector('#crud-original-price').value) || null,
        stock: Number(modal.querySelector('#crud-stock').value) || 10,
        location: modal.querySelector('#crud-location').value.trim() || 'Jakarta',
        shopName: modal.querySelector('#crud-shop').value.trim() || 'Pasarin Store',
        image: modal.querySelector('#crud-image').value.trim() || null,
        isFlashSale: modal.querySelector('#crud-flashsale').checked,
        description: modal.querySelector('#crud-desc').value.trim()
      };

      let res;
      if (isEdit) {
        res = await PasarinAPI.updateProduct(productId, payload);
      } else {
        res = await PasarinAPI.createProduct(payload);
      }

      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Simpan Perubahan' : 'Tambah Produk';

      if (res && res.success) {
        if (window.showToast) window.showToast(res.message, 'success');
        modal.classList.remove('active');
        // Refresh katalog
        await this.loadInitialData();
        // Refresh tabel CRUD
        this.openProductCrudModal();
      } else {
        if (window.showToast) window.showToast(res ? res.message : 'Gagal menyimpan produk ke database.', 'error');
      }
    };

    modal.classList.add('active');
  },

  /* Hapus Produk */
  async deleteProduct(productId) {
    const p = this.products.find(x => x.id === productId);
    const prodName = p ? p.name : 'produk ini';

    if (!confirm(`Apakah Anda yakin ingin menghapus "${prodName}" dari database?`)) {
      return;
    }

    const res = await PasarinAPI.deleteProduct(productId);
    if (res && res.success) {
      if (window.showToast) window.showToast(res.message, 'info');
      await this.loadInitialData();
      this.openProductCrudModal();
    } else {
      if (window.showToast) window.showToast(res ? res.message : 'Gagal menghapus produk.', 'error');
    }
  },

  /* =========================================================
     SISTEM POP UP PROMO & VOUCHER KETIKA MASUK
     ========================================================= */
  promos: [
    {
      code: "PASARINBARU",
      category: "diskon",
      title: "Voucher Pengguna Baru",
      desc: "Diskon 100% s.d Rp100.000 tanpa minimum transaksi",
      valText: "Rp100RB",
      typeText: "Diskon 100%",
      icon: "🎁",
      minSpend: "Min. Belanja Rp0",
      validUntil: "Berlaku 7 hari sejak klaim",
      quota: "Sisa 142 voucher hari ini"
    },
    {
      code: "ONGKIRXTRA",
      category: "ongkir",
      title: "Gratis Ongkir Xtra Se-Indonesia",
      desc: "Subsidi ongkir s.d Rp50.000 ke seluruh nusantara",
      valText: "GRATIS",
      typeText: "Ongkir Rp0",
      icon: "🚚",
      minSpend: "Min. Belanja Rp30.000",
      validUntil: "Berlaku s.d akhir bulan",
      quota: "Kuota tersedia"
    },
    {
      code: "FLASHSALE80",
      category: "diskon",
      title: "Flash Sale Kilat Super Murah",
      desc: "Diskon ekstra s.d 80% untuk produk gadget & fashion pilihan",
      valText: "80% OFF",
      typeText: "Flash Sale",
      icon: "⚡",
      minSpend: "Pukul 12:00 & 20:00 WIB",
      validUntil: "Berakhir dalam 3 jam",
      quota: "Sisa 35 kuota"
    },
    {
      code: "CASHBACK50",
      category: "cashback",
      title: "Cashback Kilat 50% PasarinPay",
      desc: "Cashback Koin s.d Rp50.000 via GoPay, DANA & OVO",
      valText: "50% CB",
      typeText: "Cashback Koin",
      icon: "💰",
      minSpend: "Min. Belanja Rp50.000",
      validUntil: "Khusus pembayaran digital",
      quota: "Sisa 85 voucher"
    },
    {
      code: "PILIHLOKAL",
      category: "lokal",
      title: "Bangga Buatan Lokal (UMKM)",
      desc: "Potongan langsung Rp25.000 khusus produk UMKM terverifikasi",
      valText: "Rp25RB",
      typeText: "Produk Lokal",
      icon: "🏬",
      minSpend: "Min. Belanja Rp75.000",
      validUntil: "Dukung Produk Lokal",
      quota: "Kuota spesial UMKM"
    },
    {
      code: "GAJIANHEMAT",
      category: "diskon",
      title: "Ekstra Diskon Gajian (Payday Sale)",
      desc: "Ekstra potongan 15% maks. Rp150.000 untuk semua kategori",
      valText: "15% OFF",
      typeText: "Payday Extra",
      icon: "🛍️",
      minSpend: "Min. Belanja Rp150.000",
      validUntil: "Berlaku minggu gajian",
      quota: "Sisa 64 voucher"
    }
  ],

  activePromoTab: 'all',
  claimedPromos: [],

  async loadBanners() {
    try {
      const res = await fetch(`${window.PasarinAPI.baseUrl}/banners`);
      const data = await res.json();
      if (data && data.success && data.data) {
        this.renderBanners(data.data);
      }
    } catch (e) {
      console.warn('Gagal fetch banner dari server:', e);
    }
  },

  renderBanners(banners) {
    if (!banners) return;

    // Render Banner Kiri (Hero Left)
    if (banners.left) {
      const elLeft = document.getElementById('hero-banner-left');
      const elBadge = document.getElementById('banner-left-badge');
      const elTitle = document.getElementById('banner-left-title');
      const elPills = document.getElementById('banner-left-pills');
      const elImg = document.getElementById('banner-left-img');

      if (elLeft && banners.left.bgGradient) {
        elLeft.style.background = banners.left.bgGradient;
      }
      if (elBadge && banners.left.badge) {
        elBadge.textContent = banners.left.badge;
      }
      if (elTitle && banners.left.title) {
        elTitle.textContent = banners.left.title;
      }
      if (elImg && banners.left.modelImage) {
        elImg.src = banners.left.modelImage;
      }
      if (elPills && Array.isArray(banners.left.pills)) {
        elPills.innerHTML = banners.left.pills.map(p => `
          <span class="shopee-pill">${p}</span>
        `).join('');
      }
    }

    // Render Banner Kanan (Hero Right)
    if (banners.right) {
      const elRight = document.getElementById('hero-banner-right');
      const elImg1 = document.getElementById('banner-right-img1');
      const elImg2 = document.getElementById('banner-right-img2');
      const elPill1Title = document.getElementById('banner-right-pill1-title');
      const elPill1Val = document.getElementById('banner-right-pill1-val');
      const elPill2Title = document.getElementById('banner-right-pill2-title');
      const elPill2Val = document.getElementById('banner-right-pill2-val');

      if (elRight && banners.right.bgGradient) {
        elRight.style.background = banners.right.bgGradient;
      }
      if (elImg1 && banners.right.modelImage1) elImg1.src = banners.right.modelImage1;
      if (elImg2 && banners.right.modelImage2) elImg2.src = banners.right.modelImage2;
      if (elPill1Title && banners.right.pill1Title) elPill1Title.textContent = banners.right.pill1Title;
      if (elPill1Val && banners.right.pill1Val) elPill1Val.textContent = banners.right.pill1Val;
      if (elPill2Title && banners.right.pill2Title) elPill2Title.textContent = banners.right.pill2Title;
      if (elPill2Val && banners.right.pill2Val) elPill2Val.textContent = banners.right.pill2Val;
    }
  },

  async initPromoSystem() {
    try {
      const stored = localStorage.getItem('pasarin_claimed_promos');
      this.claimedPromos = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.claimedPromos = [];
    }

    try {
      const res = await fetch(`${window.PasarinAPI.baseUrl}/promos`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        this.promos = data.data.map(p => ({
          code: p.code,
          category: p.category || 'diskon',
          title: p.title || p.code,
          desc: p.description || '',
          valText: p.discountType === 'percent' ? `${p.discountValue}% OFF` : (p.category === 'ongkir' ? 'GRATIS' : (p.discountValue >= 1000 ? `Rp${Math.round(p.discountValue/1000)}RB` : `Rp${p.discountValue}`)),
          typeText: p.discountType === 'percent' ? `Diskon ${p.discountValue}%` : (p.category === 'ongkir' ? 'Ongkir Rp0' : `Potongan Rp${p.discountValue.toLocaleString('id-ID')}`),
          icon: p.category === 'ongkir' ? '🚚' : (p.category === 'cashback' ? '💰' : (p.category === 'lokal' ? '🏬' : '🎁')),
          minSpend: p.minSpend > 0 ? `Min. Belanja Rp${p.minSpend.toLocaleString('id-ID')}` : 'Min. Belanja Rp0',
          validUntil: 'Berlaku s.d akhir bulan',
          quota: `Sisa ${p.quota - (p.usedCount || 0)} voucher`
        }));
      }
    } catch (e) {
      console.warn('Gagal memuat promo dari server', e);
    }

    this.renderPromoTickets();
    this.updatePromoBadgeCount();

    // Cek parameter login sukses (?login_success=1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('login_success') || urlParams.has('welcome')) {
      // Bersihkan URL query tanpa refresh
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      setTimeout(() => {
        if (window.showToast) {
          window.showToast('🎉 Selamat datang di Pasarin! Klaim voucher belanja Anda.', 'success');
        }
        this.openPromoModal();
      }, 500);
      return;
    }

    // Cek apakah pop up otomatis diizinkan (belum di-dismiss hari ini)
    const today = new Date().toDateString();
    const dismissedDate = localStorage.getItem('pasarin_promo_dismissed_date');
    const shownThisSession = sessionStorage.getItem('pasarin_promo_shown');

    if (dismissedDate !== today && !shownThisSession) {
      setTimeout(() => {
        this.openPromoModal();
      }, 900);
    }
  },

  openPromoModal() {
    const modal = document.getElementById('promo-modal-overlay');
    if (modal) {
      modal.classList.add('active');
      sessionStorage.setItem('pasarin_promo_shown', 'true');
    }
  },

  closePromoModal() {
    const modal = document.getElementById('promo-modal-overlay');
    const chk = document.getElementById('chk-dont-show-promo');
    if (chk && chk.checked) {
      localStorage.setItem('pasarin_promo_dismissed_date', new Date().toDateString());
    }
    if (modal) {
      modal.classList.remove('active');
    }
  },

  filterPromoTab(category, btnElement) {
    this.activePromoTab = category;
    const tabBtns = document.querySelectorAll('.promo-tab-item');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    this.renderPromoTickets();
  },

  renderPromoTickets() {
    const listEl = document.getElementById('promo-ticket-list');
    if (!listEl) return;

    let filtered = this.promos;
    if (this.activePromoTab !== 'all') {
      filtered = this.promos.filter(p => p.category === this.activePromoTab);
    }

    listEl.innerHTML = filtered.map(p => {
      const isClaimed = this.claimedPromos.includes(p.code);
      return `
        <div class="promo-ticket">
          <div class="ticket-left">
            <span class="ticket-icon">${p.icon}</span>
            <span class="ticket-val">${p.valText}</span>
            <span class="ticket-type-lbl">${p.typeText}</span>
          </div>
          <div class="ticket-center">
            <h4 class="ticket-title" title="${p.title}">${p.title}</h4>
            <p class="ticket-desc">${p.desc}</p>
            <div class="ticket-meta">
              <span>${p.minSpend}</span>
              <span>•</span>
              <span class="ticket-code-pill" onclick="PasarinApp.copyPromoCode('${p.code}')" title="Klik untuk salin kode voucher">
                📋 ${p.code}
              </span>
              <span>•</span>
              <span style="color:#d97706; font-weight:700;">${p.quota}</span>
            </div>
          </div>
          <div class="ticket-right">
            <button class="btn-claim-voucher ${isClaimed ? 'claimed' : ''}" onclick="PasarinApp.claimPromo('${p.code}', this)">
              ${isClaimed ? '✓ Tersimpan' : 'Klaim'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  claimPromo(code, btn) {
    if (!this.claimedPromos.includes(code)) {
      this.claimedPromos.push(code);
      localStorage.setItem('pasarin_claimed_promos', JSON.stringify(this.claimedPromos));
    }

    if (btn) {
      btn.classList.add('claimed');
      btn.textContent = '✓ Tersimpan';
    }

    this.updatePromoBadgeCount();

    // Jika sedang berada di halaman checkout, langsung pasang voucher ke pesanan
    if (window.location.hash.startsWith('#/checkout') && window.PasarinCart) {
      window.PasarinCart.applyVoucher(code);
      this.closePromoModal();
      return;
    }

    if (window.showToast) {
      window.showToast(`✓ Voucher "${code}" berhasil diklaim ke akun Anda!`, 'success');
    }
  },

  async claimCustomPromoInput() {
    const input = document.getElementById('custom-promo-code-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (!code) {
      if (window.showToast) window.showToast('Silakan ketik kode voucher / promo terlebih dahulu.', 'warning');
      return;
    }

    const res = await PasarinAPI.validatePromo(code, 300000);
    if (res && res.success && res.data) {
      const p = res.data;
      if (!this.promos.find(x => x.code === p.code)) {
        this.promos.unshift({
          code: p.code,
          category: p.category || 'diskon',
          title: p.title || p.code,
          desc: p.description || 'Voucher & Kode Promo Spesial',
          valText: p.discountType === 'percent' ? `${p.discountValue}% OFF` : `Rp${Math.round(p.discountValue / 1000)}RB`,
          typeText: p.discountType === 'percent' ? `Diskon ${p.discountValue}%` : 'Potongan Langsung',
          icon: '🎁',
          minSpend: 'Siap digunakan saat checkout',
          validUntil: 'Berlaku',
          quota: 'Aktif'
        });
      }

      input.value = '';
      this.renderPromoTickets();

      if (window.location.hash.startsWith('#/checkout') && window.PasarinCart) {
        this.claimPromo(p.code);
      } else {
        this.claimPromo(p.code);
        if (window.showToast) window.showToast(`🎉 Voucher / Kode promo "${p.code}" berhasil diklaim!`, 'success');
      }
    } else {
      if (window.showToast) window.showToast(res ? res.message : `Voucher "${code}" tidak ditemukan atau sudah tidak aktif.`, 'error');
    }
  },

  claimAllPromos() {
    this.promos.forEach(p => {
      if (!this.claimedPromos.includes(p.code)) {
        this.claimedPromos.push(p.code);
      }
    });

    localStorage.setItem('pasarin_claimed_promos', JSON.stringify(this.claimedPromos));
    this.renderPromoTickets();
    this.updatePromoBadgeCount();

    const claimAllBtn = document.getElementById('btn-claim-all');
    if (claimAllBtn) {
      claimAllBtn.textContent = '✓ Semua Promo Berhasil Diklaim!';
      claimAllBtn.style.background = '#10b981';
      claimAllBtn.disabled = true;
    }

    if (window.showToast) {
      window.showToast('🎉 Selamat! 6 Voucher belanja berhasil diklaim.', 'success');
    }
  },

  copyPromoCode(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        if (window.showToast) {
          window.showToast(`✓ Kode promo "${code}" disalin ke clipboard!`, 'info');
        }
      }).catch(() => {
        if (window.showToast) window.showToast(`Kode promo: ${code}`, 'info');
      });
    } else {
      if (window.showToast) window.showToast(`Kode promo: ${code}`, 'info');
    }
  },

  updatePromoBadgeCount() {
    const badge = document.getElementById('fab-voucher-count');
    if (!badge) return;
    const remaining = this.promos.length - this.claimedPromos.length;
    badge.textContent = remaining > 0 ? remaining : '✓';
    badge.style.background = remaining > 0 ? '#ffffff' : '#10b981';
    badge.style.color = remaining > 0 ? '#ee4d2d' : '#ffffff';
  },

  bindGlobalEvents() {
    const homeForm = document.getElementById('form-home');
    if (homeForm) {
      homeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = homeForm.querySelector('input');
        const q = input ? input.value.trim() : '';
        if (window.PasarinSearchHistory && q) {
          window.PasarinSearchHistory.recordSearch(q);
        }
        window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
      });
    }

    const searchForm = document.getElementById('form-search');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = searchForm.querySelector('input');
        const q = input ? input.value.trim() : '';
        if (window.PasarinSearchHistory && q) {
          window.PasarinSearchHistory.recordSearch(q);
        }
        window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
      });
    }
  }
};

/* =========================================================
   Pencarian Sering & Riwayat Keyword Dinamis (Pasarin Search History)
   ========================================================= */
const PasarinSearchHistory = {
  STORAGE_KEY: 'pasarin_frequent_searches',

  DEFAULT_SUGGESTIONS: [
    { term: 'Sepatu Pria', count: 16 },
    { term: 'Tas Ransel', count: 12 },
    { term: 'Kaos Polos', count: 10 },
    { term: 'Jaket Hoodie', count: 8 },
    { term: 'Kemeja Casual', count: 7 },
    { term: 'Headphone Bluetooth', count: 6 },
    { term: 'Jam Tangan Pria', count: 5 }
  ],

  init() {
    this.renderFrequentTags();
  },

  getHistory() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca history pencarian', e);
    }
    return [...this.DEFAULT_SUGGESTIONS];
  },

  recordSearch(rawTerm) {
    if (!rawTerm) return;
    const term = rawTerm.trim();
    if (term.length < 2) return;

    let history = this.getHistory();
    const existingIdx = history.findIndex(it => it.term.toLowerCase() === term.toLowerCase());

    if (existingIdx !== -1) {
      history[existingIdx].count = (history[existingIdx].count || 1) + 1;
      history[existingIdx].lastSearched = Date.now();
    } else {
      history.unshift({
        term: term,
        count: 1,
        lastSearched: Date.now()
      });
    }

    // Urutkan berdasarkan frekuensi pencarian (count) terbanyak, lalu waktu terbaru
    history.sort((a, b) => (b.count - a.count) || ((b.lastSearched || 0) - (a.lastSearched || 0)));

    // Batasi hingga 15 kata kunci teratas
    history = history.slice(0, 15);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (e) {}

    this.renderFrequentTags();
  },

  renderFrequentTags() {
    const container = document.getElementById('search-frequent-tags');
    if (!container) return;

    const history = this.getHistory();
    const topKeywords = history.slice(0, 7);

    container.innerHTML = topKeywords.map(item => `
      <a href="#/search?q=${encodeURIComponent(item.term)}" 
         class="frequent-search-tag" 
         onclick="PasarinSearchHistory.handleTagClick('${item.term.replace(/'/g, "\\'")}')" 
         title="Sering dicari (${item.count}x)">
        ${item.term}
      </a>
    `).join('');
  },

  handleTagClick(term) {
    this.recordSearch(term);
    const homeInput = document.querySelector('#form-home input');
    if (homeInput) homeInput.value = term;
    const searchInput = document.querySelector('#form-search input');
    if (searchInput) searchInput.value = term;
  }
};

window.PasarinSearchHistory = PasarinSearchHistory;
window.PasarinApp = PasarinApp;

document.addEventListener('DOMContentLoaded', () => {
  if (window.PasarinAuth) window.PasarinAuth.init();
  if (window.PasarinCart) window.PasarinCart.init();
  if (window.PasarinSearchHistory) window.PasarinSearchHistory.init();
  if (window.PasarinApp) window.PasarinApp.init();
});
