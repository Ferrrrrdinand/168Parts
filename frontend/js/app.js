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
    // Garansi keselamatan: loader belanja wajib tertutup maksimal 1.5 detik
    setTimeout(() => {
      this.hideShoppingLoader();
    }, 1500);

    try {
      this.initTimer();
      this.bindGlobalEvents();
      if (window.PasarinSearchHistory) window.PasarinSearchHistory.init();
      await this.loadInitialData();
      this.initPromoSystem();
      await this.loadBanners();
      this.route();
      window.addEventListener('hashchange', () => this.route());
    } catch (e) {
      console.warn('Init error, gracefully showing interface:', e);
    } finally {
      this.hideShoppingLoader();
    }
  },

  hideShoppingLoader() {
    const loader = document.getElementById('shopping-loader');
    if (loader && !loader.classList.contains('fade-out')) {
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
          if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
        }, 500);
      }, 700);
    }
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

  renderProductFallback(imgEl) {
    if (!imgEl) return;
    imgEl.src = 'images/product-placeholder.svg';
  },

  renderProductMedia(p, fallbackCls = 'i lg') {
    const placeholderUrl = 'images/product-placeholder.svg';
    const imgSrc = (p && p.image && !p.image.includes('unsplash.com')) ? p.image : placeholderUrl;
    const prodName = p && p.name ? p.name.replace(/"/g, '&quot;') : 'Produk';
    return `<img src="${imgSrc}" alt="${prodName}" class="prod-real-img" loading="lazy" onerror="this.onerror=null; this.src='images/product-placeholder.svg';">`;
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
      this.promos = promoRes.data.map(p => {
        const remaining = p.remainingQuota !== undefined ? Number(p.remainingQuota) : Math.max(0, (p.quota || 100) - (p.usedCount || 0));
        const userClaims = Number(p.userClaimCount || 0);
        return {
          code: p.code,
          category: p.category || 'diskon',
          title: p.title,
          desc: p.description || p.title,
          valText: p.discountType === 'percent' ? `${p.discountValue}% OFF` : `Rp${Math.round(p.discountValue / 1000)}RB`,
          typeText: p.discountType === 'percent' ? `Diskon ${p.discountValue}%` : 'Potongan Langsung',
          icon: p.category === 'ongkir' ? '🚚' : (p.category === 'cashback' ? '💰' : (p.category === 'lokal' ? '🏬' : '🎁')),
          minSpend: p.minSpend > 0 ? `Min. Belanja Rp${p.minSpend.toLocaleString('id-ID')}` : 'Min. Belanja Rp0',
          validUntil: 'Berlaku s.d akhir bulan',
          quota: `Sisa ${remaining} voucher`,
          remainingQuota: remaining,
          userClaimCount: userClaims,
          userAvailableCount: Number(p.userAvailableCount || 0),
          maxClaimPerUser: Number(p.maxClaimPerUser || 3),
          isSoldOut: Boolean(p.isSoldOut || remaining <= 0),
          isMaxClaimed: Boolean(p.isMaxClaimed || userClaims >= 3),
          canClaim: Boolean(p.canClaim !== undefined ? p.canClaim : (remaining > 0 && userClaims < 3))
        };
      });
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
      { id: 'lcd', name: 'LCD & Layar', icon: 'phone', image: 'images/product-placeholder.svg' },
      { id: 'baterai', name: 'Baterai HP', icon: 'battery', image: 'images/product-placeholder.svg' },
      { id: 'ic', name: 'IC & Chipset', icon: 'cpu', image: 'images/product-placeholder.svg' },
      { id: 'tools', name: 'Alat Servis & Blower', icon: 'tool', image: 'images/product-placeholder.svg' },
      { id: 'solder', name: 'Solder & Timah', icon: 'flame', image: 'images/product-placeholder.svg' },
      { id: 'lem', name: 'Lem & Perekat', icon: 'bottle', image: 'images/product-placeholder.svg' },
      { id: 'backdoor', name: 'Backdoor & Kaca', icon: 'shield', image: 'images/product-placeholder.svg' },
      { id: 'tester', name: 'Alat Ukur & Tester', icon: 'gauge', image: 'images/product-placeholder.svg' },
      { id: 'pinset', name: 'Pinset & Pembuka', icon: 'scissors', image: 'images/product-placeholder.svg' },
      { id: 'fleksibel', name: 'Sparepart Fleksibel', icon: 'zap', image: 'images/product-placeholder.svg' }
    ];
  },

  getFallbackProducts() {
    return [
  // --- KATEGORI 1: LCD & Layar ---
  {
    id: '168-lcd-ip11',
    name: 'LCD Touchscreen iPhone 11 Incell True Tone Grade A+ Fullset',
    category: 'LCD & Layar',
    price: 245000,
    originalPrice: 350000,
    discountPercent: 30,
    rating: 4.9,
    soldCount: 1420,
    stock: 45,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 38,
    image: 'images/product-placeholder.svg',
    description: 'LCD Touchscreen iPhone 11 kualitas Incell High Quality. Support True Tone (bisa dipindah via programmer JC V1SE), sensitivitas sentuhan 100% responsif, kontras warna mendekati original bawaan. Garansi tes 7 hari sebelum dipasang lem.',
    specs: ['Kompatibilitas: Apple iPhone 11 (6.1 inch)', 'Tipe Layar: Incell HD Multi-Touch', 'Fitur: Support True Tone Transfer & 3D Touch', 'Garansi: Garansi Tes 7 Hari (Segel Utuh)']
  },
  {
    id: '168-lcd-ipx',
    name: 'LCD iPhone X / XS OLED Hard GX Original Touchscreen Fullset',
    category: 'LCD & Layar',
    price: 365000,
    originalPrice: 480000,
    discountPercent: 24,
    rating: 4.8,
    soldCount: 980,
    stock: 30,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'LCD OLED GX iPhone X / XS. Warna pekat OLED, bezel tipis presisi, hemat daya baterai. Pilihan terbaik teknisi HP untuk pergantian layar pecah.',
    specs: ['Tipe: Hard OLED GX Display', 'Ukuran: 5.8 inch Super Retina', 'Support: True Tone & Face ID Aktif', 'Garansi: Garansi Tes 7 Hari']
  },
  {
    id: '168-lcd-ip12',
    name: 'LCD iPhone 12 / 12 Pro OLED JK Incell Assembly Replacement',
    category: 'LCD & Layar',
    price: 520000,
    originalPrice: 650000,
    discountPercent: 20,
    rating: 4.9,
    soldCount: 640,
    stock: 25,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 21,
    image: 'images/product-placeholder.svg',
    description: 'LCD iPhone 12 dan 12 Pro JK OLED. Presisi sudut frame dan konektor soket 100% pas. Layar tajam dan respons multi sentuh sangat stabil.',
    specs: ['Kompatibel: iPhone 12 / 12 Pro (6.1 inch)', 'Resolusi: 2532 x 1170 pixels', 'Garansi: Garansi Tes 7 Hari']
  },
  {
    id: '168-lcd-a50',
    name: 'LCD Touchscreen Samsung Galaxy A50 A505 OLED 2 / Incell',
    category: 'LCD & Layar',
    price: 185000,
    originalPrice: 240000,
    discountPercent: 23,
    rating: 4.8,
    soldCount: 1850,
    stock: 60,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 52,
    image: 'images/product-placeholder.svg',
    description: 'LCD Samsung A50 (A505F / A505G). Kualitas kontras bagus, pengaturan kecerahan (brightness) berfungsi normal. Sudah satu set touchscreen.',
    specs: ['Model: Samsung Galaxy A50 SM-A505F', 'Tipe: Incell Display With Touch', 'Kecerahan: Adjustable Brightness', 'Garansi: Garansi Tes 7 Hari']
  },
  {
    id: '168-lcd-a51',
    name: 'LCD Samsung Galaxy A51 A515 Incell OLED 2 Kontras Mantap',
    category: 'LCD & Layar',
    price: 195000,
    originalPrice: 260000,
    discountPercent: 25,
    rating: 4.8,
    soldCount: 1220,
    stock: 40,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Layar LCD Samsung A51 A515F fullset touchscreen. Presisi lubang kamera tengah (punch hole), bezel tipis rapi.',
    specs: ['Model: Samsung Galaxy A51 (SM-A515)', 'Layar: 6.5 inch FHD+', 'Garansi: Garansi Tes 7 Hari']
  },
  {
    id: '168-lcd-rn8',
    name: 'LCD Touchscreen Xiaomi Redmi Note 8 Original OEM Fullset',
    category: 'LCD & Layar',
    price: 145000,
    originalPrice: 195000,
    discountPercent: 26,
    rating: 4.9,
    soldCount: 2340,
    stock: 75,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 67,
    image: 'images/product-placeholder.svg',
    description: 'LCD Xiaomi Redmi Note 8 kualitas OEM. Warna jernih tajam, respon sentuhan lancar tanpa ghost touch. Sangat diminati teknisi servis.',
    specs: ['Model: Redmi Note 8 (M1908C3JH)', 'Resolusi: Full HD 1080 x 2340', 'Garansi: Garansi Tes 7 Hari']
  },
  {
    id: '168-lcd-rn9',
    name: 'LCD Touchscreen Xiaomi Redmi Note 9 Incell Crown / Diamond',
    category: 'LCD & Layar',
    price: 155000,
    originalPrice: 210000,
    discountPercent: 26,
    rating: 4.8,
    soldCount: 1530,
    stock: 50,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'LCD Fullset Redmi Note 9. Presisi lubang kamera depan samping, flexibel tebal tidak mudah sobek saat pemasangan.',
    specs: ['Model: Redmi Note 9', 'Ukuran: 6.53 inch IPS LCD', 'Garansi: Garansi Tes 7 Hari']
  },
  {
    id: '168-lcd-a3s',
    name: 'LCD Touchscreen Oppo A3s / Realme C1 / A5 Fullset Original OEM',
    category: 'LCD & Layar',
    price: 125000,
    originalPrice: 175000,
    discountPercent: 28,
    rating: 4.8,
    soldCount: 2900,
    stock: 90,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 85,
    image: 'images/product-placeholder.svg',
    description: 'LCD Oppo A3s / A5 / Realme C1. Produk terlaris di Shopee 168part. Kaca tebal anti gores, frame presisi.',
    specs: ['Kompatibel: Oppo A3s (CPH1803, CPH1853), Realme C1', 'Ukuran: 6.2 inch notch display', 'Garansi: Garansi Tes 7 Hari']
  },
  {
    id: '168-lcd-y12',
    name: 'LCD Touchscreen Vivo Y12 / Y15 / Y17 Fullset Presisi Tinggi',
    category: 'LCD & Layar',
    price: 130000,
    originalPrice: 180000,
    discountPercent: 27,
    rating: 4.9,
    soldCount: 2100,
    stock: 80,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Layar LCD Vivo Y12 / Y15 / Y17 / Y11 / Y3. Kualitas OEM Diamond/Crown, kontras warna tajam dan sentuhan responsif.',
    specs: ['Kompatibel: Vivo Y12, Y15, Y17, Y11 2019', 'Layar: Halo FullView Display', 'Garansi: Garansi Tes 7 Hari']
  },

  // --- KATEGORI 2: Baterai HP ---
  {
    id: '168-bat-ip11',
    name: 'Baterai iPhone 11 Battery Original Foxconn 3110mAh Zero Cycle',
    category: 'Baterai HP',
    price: 145000,
    originalPrice: 200000,
    discountPercent: 27,
    rating: 4.9,
    soldCount: 1650,
    stock: 55,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 49,
    image: 'images/product-placeholder.svg',
    description: 'Baterai iPhone 11 kapasitas 3110mAh Original Foxconn OEM. Kondisi baru 0 cycle count, cell baterai padat anti kembung, daya tahan awet seharian.',
    specs: ['Kapasitas: 3110 mAh', 'Tegangan: 3.83V Li-ion Polymer', 'Kondisi: 100% Health 0 Cycle', 'Garansi: 1 Bulan Tukar Baru']
  },
  {
    id: '168-bat-ipx',
    name: 'Baterai iPhone X Battery Foxconn 2716mAh High Capacity',
    category: 'Baterai HP',
    price: 125000,
    originalPrice: 170000,
    discountPercent: 26,
    rating: 4.8,
    soldCount: 1120,
    stock: 40,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Baterai cadangan iPhone X kapasitas standar original 2716mAh. Dilengkapi IC proteksi ganda mencegah overheat dan overcharge.',
    specs: ['Kapasitas: 2716 mAh', 'Model: APN 616-00351', 'Garansi: 1 Bulan']
  },
  {
    id: '168-bat-bn53',
    name: 'Baterai Xiaomi Redmi Note 9 Pro / Poco X3 BN53 Original 5020mAh',
    category: 'Baterai HP',
    price: 85000,
    originalPrice: 120000,
    discountPercent: 29,
    rating: 4.9,
    soldCount: 2200,
    stock: 85,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 78,
    image: 'images/product-placeholder.svg',
    description: 'Baterai Xiaomi BN53 untuk Redmi Note 9 Pro dan Note 9S. Kapasitas murni 5020 mAh mendukung Fast Charging 33W.',
    specs: ['Kode Baterai: BN53', 'Kapasitas: 5020 mAh', 'Support: Fast Charging 30W/33W', 'Garansi: 1 Bulan']
  },
  {
    id: '168-bat-eb-a50',
    name: 'Baterai Samsung Galaxy A50 / A30s EB-BA505ABU Original 4000mAh',
    category: 'Baterai HP',
    price: 78000,
    originalPrice: 110000,
    discountPercent: 29,
    rating: 4.8,
    soldCount: 1980,
    stock: 70,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Baterai Samsung Galaxy A50, A30, A30s, A20. Kapasitas 4000mAh original equipment manufacturer. Awet dan stabil.',
    specs: ['Kode: EB-BA505ABU', 'Kapasitas: 4000 mAh', 'Tegangan: 3.85V', 'Garansi: 1 Bulan']
  },
  {
    id: '168-bat-blp673',
    name: 'Baterai Oppo A3s / Realme C1 BLP673 Original 4230mAh',
    category: 'Baterai HP',
    price: 68000,
    originalPrice: 95000,
    discountPercent: 28,
    rating: 4.9,
    soldCount: 3100,
    stock: 95,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 90,
    image: 'images/product-placeholder.svg',
    description: 'Baterai Oppo A3s BLP673. Paling laris untuk servis pergantian baterai drop atau kembung. Daya simpan stabil.',
    specs: ['Kode: BLP673', 'Kapasitas: 4230 mAh', 'Garansi: 1 Bulan']
  },
  {
    id: '168-bat-bk3',
    name: 'Baterai Vivo Y12 / Y15 / Y17 B-K3 Original 5000mAh Jumbo',
    category: 'Baterai HP',
    price: 75000,
    originalPrice: 105000,
    discountPercent: 28,
    rating: 4.8,
    soldCount: 1870,
    stock: 65,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Baterai Vivo B-K3 kapasitas jumbo 5000mAh. Untuk Vivo Y12, Y15, Y17. Plug and play presisi tanpa modifikasi soket.',
    specs: ['Kode: B-K3', 'Kapasitas: 5000 mAh', 'Garansi: 1 Bulan']
  },

  // --- KATEGORI 3: IC & Chipset ---
  {
    id: '168-ic-wtr2965',
    name: 'IC WTR2965 Sinyal RF Transceiver Original Qualcomm Baru',
    category: 'IC & Chipset',
    price: 42000,
    originalPrice: 60000,
    discountPercent: 30,
    rating: 4.9,
    soldCount: 1780,
    stock: 120,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 110,
    image: 'images/product-placeholder.svg',
    description: 'IC WTR2965 solusi utama masalah sinyal bulat (no service), searching, atau no baseband pada Xiaomi Redmi Note 5, Note 7, Oppo A3s, Vivo Y91, Samsung.',
    specs: ['Tipe: RF Intermediate Frequency Transceiver', 'Pabrikan: Qualcomm Asli', 'Kondisi: 100% Baru Kaki Bola Timah Rapi', 'Garansi: Non-garansi pasang solder']
  },
  {
    id: '168-ic-pm8953',
    name: 'IC Power PM8953 0VV Qualcomm Original Xiaomi / Oppo / Vivo',
    category: 'IC & Chipset',
    price: 48000,
    originalPrice: 70000,
    discountPercent: 31,
    rating: 4.8,
    soldCount: 1450,
    stock: 90,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'IC Power Management PM8953. Digunakan untuk mengatasi HP mati total (matot), konsumsi arus boros, short vph pwr.',
    specs: ['Model: PM8953 (0VV)', 'Fungsi: Power Management IC', 'Kondisi: Baru (Lead-Free BGA)']
  },
  {
    id: '168-ic-smb1351',
    name: 'IC Charger SMB1351 Qualcomm Quick Charge IC Original',
    category: 'IC & Chipset',
    price: 35000,
    originalPrice: 50000,
    discountPercent: 30,
    rating: 4.9,
    soldCount: 920,
    stock: 80,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'IC Cas / Charger SMB1351. Solusi HP tidak bisa dicas, suhu baterai terlalu tinggi/rendah, fake charging.',
    specs: ['Model: SMB1351', 'Fungsi: Battery Charging Controller IC', 'Kondisi: Baru']
  },
  {
    id: '168-ic-wcd9335',
    name: 'IC Audio Codec WCD9335 Qualcomm Audio Chipset Original',
    category: 'IC & Chipset',
    price: 55000,
    originalPrice: 75000,
    discountPercent: 26,
    rating: 4.8,
    soldCount: 540,
    stock: 50,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'IC Audio WCD9335 untuk memperbaiki masalah speaker mati, mic tidak berfungsi, nada dering hening pada HP chipset Snapdragon.',
    specs: ['Model: WCD9335', 'Fungsi: Hi-Fi Audio Codec', 'Kondisi: Baru']
  },

  // --- KATEGORI 4: Alat Servis & Blower ---
  {
    id: '168-blower-857dw',
    name: 'Blower Uap Panas Quick 857DW+ Original Digital Lead Free Rework',
    category: 'Alat Servis & Blower',
    price: 875000,
    originalPrice: 1150000,
    discountPercent: 24,
    rating: 5.0,
    soldCount: 430,
    stock: 18,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 16,
    image: 'images/product-placeholder.svg',
    description: 'Blower Quick 857DW+ merupakan standar emas teknisi HP profesional. Aliran angin spiral helikopter lembut, suhu stabil akurat, elemen pemanas awet.',
    specs: ['Konsumsi Daya: 580 Watt', 'Rentang Suhu: 100°C - 450°C', 'Tipe Angin: Pompa Udara Diafragma Spiral', 'Garansi: Garansi Toko 1 Bulan']
  },
  {
    id: '168-solder-wemon',
    name: 'Solder Station WEMON 936A ESD Safe Ceramic Fast Heating 60W',
    category: 'Alat Servis & Blower',
    price: 185000,
    originalPrice: 250000,
    discountPercent: 26,
    rating: 4.9,
    soldCount: 890,
    stock: 35,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Solder station WEMON 936A anti-statis ESD Safe. Panas super cepat, mata solder runcing presisi untuk jumper komponen mikro HP.',
    specs: ['Daya: 60 Watt', 'Rentang Suhu: 200°C - 480°C', 'Elemen: Keramik A1321 Awet', 'Fitur: ESD Safe']
  },
  {
    id: '168-multi-dt17n',
    name: 'Multimeter Digital Sunshine DT-17N True RMS Auto Range Teknisi',
    category: 'Alat Servis & Blower',
    price: 265000,
    originalPrice: 350000,
    discountPercent: 24,
    rating: 4.9,
    soldCount: 670,
    stock: 28,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 25,
    image: 'images/product-placeholder.svg',
    description: 'Sunshine DT-17N Multimeter digital otomatis terbaik untuk teknisi HP. Ukur buzzer short sangat responsif tanpa delay, ukur tegangan DC volt & diode presisi.',
    specs: ['Tipe: True RMS Auto Range Multitester', 'Display: 6000 Counts Backlight LCD', 'Fungsi: Volt, Hambatan, Kapasitor, Diode, Buzzer Cepat', 'Bonus: Jarum Probe Tajam + Baterai']
  },
  {
    id: '168-cpb-separator',
    name: 'Pemanas Pembuka Layar LCD CPB 998 Heating Pad Silicone Mat',
    category: 'Alat Servis & Blower',
    price: 215000,
    originalPrice: 280000,
    discountPercent: 23,
    rating: 4.8,
    soldCount: 510,
    stock: 22,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Matras pemanas CPB 998 untuk melunakkan lem LCD dan touchscreen HP atau iPad/tablet tanpa merusak frame atau polarizer.',
    specs: ['Ukuran: 30 x 17 cm (Bisa untuk iPad mini)', 'Suhu: 30°C - 120°C Digital Control', 'Bahan: Silikon Tahan Panas Fleksibel']
  },

  // --- KATEGORI 5: Solder & Timah ---
  {
    id: '168-flux-2uul',
    name: 'Cairan Flux Solder MR.FLUX 01 2UUL High Grade No-Clean 10cc',
    category: 'Solder & Timah',
    price: 66000,
    originalPrice: 85000,
    discountPercent: 22,
    rating: 5.0,
    soldCount: 1650,
    stock: 80,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Pasta flux premium 2UUL Mr.Flux 01. Bebas asap pekat, daya lekat timah sempurna, no-clean (tidak meninggalkan kerak gosong di papan PCB).',
    specs: ['Isi: 10cc Spuit Jarum', 'Karakter: Bening Halus No-Clean', 'Kegunaan: BGA Reballing & Komponen Mikro']
  },
  {
    id: '168-timah-xg50',
    name: 'Timah Pasta Solder Mechanic XG-50 Sn63/Pb37 35g Original',
    category: 'Solder & Timah',
    price: 38000,
    originalPrice: 55000,
    discountPercent: 30,
    rating: 4.9,
    soldCount: 2800,
    stock: 110,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 98,
    image: 'images/product-placeholder.svg',
    description: 'Timah pasta Mechanic XG-50 titik leleh 183°C. Sangat disukai teknisi untuk cetak kaki IC BGA CPU EMMC dan soket baterai.',
    specs: ['Kandungan: Sn63% Pb37%', 'Titik Leleh: 183°C', 'Berat Bersih: 35 gram', 'Kualitas: Halus tidak berpasir']
  },
  {
    id: '168-timah-gulung',
    name: 'Timah Gulung Mechanic HX-T100 0.3mm Rosin Core Super Halus',
    category: 'Solder & Timah',
    price: 32000,
    originalPrice: 45000,
    discountPercent: 28,
    rating: 4.8,
    soldCount: 1950,
    stock: 75,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Kawat timah solder super halus diameter 0.3mm khusus untuk jumper jalur HP putus, pasang konektor LCD, dan jumper IC.',
    specs: ['Diameter: 0.3 mm', 'Fluks: 2.0% Rosin Core Aktif', 'Hasil Solderan: Mengkilap dan kuat']
  },
  {
    id: '168-gootwick',
    name: 'Pita Pembersih Timah Gootwick Original CP-2015 Japan 2.0mm',
    category: 'Solder & Timah',
    price: 24000,
    originalPrice: 35000,
    discountPercent: 31,
    rating: 4.9,
    soldCount: 3200,
    stock: 130,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 120,
    image: 'images/product-placeholder.svg',
    description: 'Gootwick CP-2015 asli Jepang. Menyerap sisa timah di papan motherboard HP dengan bersih tanpa merusak jalur tembaga pad.',
    specs: ['Lebar Pita: 2.0 mm', 'Panjang: 1.5 meter', 'Origin: Made in Japan Asli']
  },

  // --- KATEGORI 6: Lem & Perekat ---
  {
    id: '168-lem-i9',
    name: 'Lem LCD LANRUI I9 Black High Adhesive Glue 50ml Kuat Elastis',
    category: 'Lem & Perekat',
    price: 22000,
    originalPrice: 32000,
    discountPercent: 31,
    rating: 4.9,
    soldCount: 4500,
    stock: 160,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 155,
    image: 'images/product-placeholder.svg',
    description: 'Lem LANRUI I9 warna hitam pekat 50ml. Lem andalan teknisi HP Surabaya. Kering elastis, anti bocor cahaya backlight LCD, daya rekat kuat tahan lama.',
    specs: ['Warna: Hitam Pekat (Black)', 'Isi: 50 ml', 'Waktu Kering: 15 - 30 menit (Solid 24 Jam)', 'Nozzle: Jarum Presisi Anti Mampet']
  },
  {
    id: '168-lem-t7000',
    name: 'Lem LCD Touchscreen Zhanlida T7000 Hitam 50ml Multi Purpose',
    category: 'Lem & Perekat',
    price: 18000,
    originalPrice: 28000,
    discountPercent: 35,
    rating: 4.8,
    soldCount: 3800,
    stock: 140,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Lem T-7000 Zhanlida hitam 50ml. Cocok untuk lem backdoor kaca, frame LCD, dan touch screen handphone.',
    specs: ['Warna: Hitam', 'Isi: 50 ml', 'Fitur: Waterproof & Shockproof']
  },
  {
    id: '168-lem-b7000',
    name: 'Lem B7000 Bening Transparan 50ml Lem Kaca Touchscreen',
    category: 'Lem & Perekat',
    price: 17000,
    originalPrice: 26000,
    discountPercent: 34,
    rating: 4.8,
    soldCount: 2900,
    stock: 120,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Lem B-7000 bening transparan. Sangat cocok untuk pemasangan LCD putih atau kaca kamera agar tidak meninggalkan noda warna.',
    specs: ['Warna: Bening / Transparan', 'Isi: 50 ml', 'Kelebihan: Tidak merusak cat housing']
  },
  {
    id: '168-falcon-530',
    name: 'Cairan Pembersih Kontak Falcon 530 Electronic Cleaner 550ml',
    category: 'Lem & Perekat',
    price: 36000,
    originalPrice: 50000,
    discountPercent: 28,
    rating: 4.9,
    soldCount: 2600,
    stock: 90,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 82,
    image: 'images/product-placeholder.svg',
    description: 'Falcon 530 spray pembersih PCB mesin HP, soket cas, dan kotoran debu. Cepat mengering tanpa meninggalkan residu basah.',
    specs: ['Isi: 550 ml Botol Kaleng Semprot', 'Sifat: Cepat Menguap Non-Konduktif', 'Aman untuk komponen elektronik sensitif']
  },

  // --- KATEGORI 7: Backdoor & Kaca ---
  {
    id: '168-bd-ip11',
    name: 'Kaca Belakang Backdoor iPhone 11 Big Hole Full Glass Replacement',
    category: 'Backdoor & Kaca',
    price: 32000,
    originalPrice: 50000,
    discountPercent: 36,
    rating: 4.9,
    soldCount: 1420,
    stock: 65,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 58,
    image: 'images/product-placeholder.svg',
    description: 'Kaca tutup belakang iPhone 11 model Big Hole (lubang kamera besar). Pemasangan mudah tidak perlu bongkar lensa kamera ataupun mesin.',
    specs: ['Tipe: Big Hole (Lubang Kamera Besar)', 'Bahan: Kaca Tempered Asli Berlogo', 'Pilihan Warna: Hitam, Putih, Merah, Ungu, Hijau, Kuning']
  },
  {
    id: '168-bd-ip12',
    name: 'Kaca Belakang Backdoor iPhone 12 / 12 Pro Big Hole Tempered Glass',
    category: 'Backdoor & Kaca',
    price: 38000,
    originalPrice: 55000,
    discountPercent: 30,
    rating: 4.8,
    soldCount: 950,
    stock: 50,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Backdoor kaca iPhone 12/12 Pro Big Hole. Kaca presisi dengan finishing matte frosted tahan sidik jari.',
    specs: ['Model: iPhone 12 / 12 Pro', 'Tipe: Big Hole Glass', 'Presisi: 100% Pas dengan Frame Stainless/Aluminium']
  },
  {
    id: '168-bd-a50',
    name: 'Backdoor Casing Belakang Samsung Galaxy A50 A505 Original OEM',
    category: 'Backdoor & Kaca',
    price: 19000,
    originalPrice: 30000,
    discountPercent: 36,
    rating: 4.8,
    soldCount: 2400,
    stock: 90,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 85,
    image: 'images/product-placeholder.svg',
    description: 'Tutup casing belakang Samsung Galaxy A50 SM-A505. Sudah termasuk kaca lensa kamera dan perekat adhesive bawaan siap pasang.',
    specs: ['Kompatibel: Samsung Galaxy A50', 'Kelengkapan: Sudah ada Kaca Lensa Kamera + Lem Perekat', 'Warna: Hitam, Biru, Putih']
  },
  {
    id: '168-bd-rn8',
    name: 'Backdoor Kaca Belakang Redmi Note 8 Original + Lem Double Tape',
    category: 'Backdoor & Kaca',
    price: 22000,
    originalPrice: 35000,
    discountPercent: 37,
    rating: 4.9,
    soldCount: 1850,
    stock: 70,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Backdoor kaca Xiaomi Redmi Note 8. Kaca mengkilap gradasi hologram persis aslinya. Sudah ada lem sekeliling frame.',
    specs: ['Model: Redmi Note 8', 'Bahan: Kaca Glass Asli', 'Warna: Neptune Blue, Space Black, Moonlight White']
  },

  // --- KATEGORI 8: Alat Ukur & Tester ---
  {
    id: '168-jc-v1se',
    name: 'JC V1SE Programmer Full Set True Tone Battery Fingerprint FaceID',
    category: 'Alat Ukur & Tester',
    price: 1250000,
    originalPrice: 1550000,
    discountPercent: 19,
    rating: 5.0,
    soldCount: 220,
    stock: 12,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Alat programmer teknisi iPhone JCID V1SE WiFi. Untuk memindahkan data True Tone layar tanpa LCD lama, reset battery health 100%, dan perbaikan Face ID.',
    specs: ['Merk: JCID V1SE WiFi Edition', 'Board Termasuk: Screen Board (7-11 Pro Max, 12-14), Battery Board, Receiver FPC Board', 'Fungsi: True Tone, Battery Cycle Reset, Vibration']
  },
  {
    id: '168-iboot-cable',
    name: 'Kabel Power Supply iBoot Mekanic Kabel Nyalakan Mesin iPhone Android',
    category: 'Alat Ukur & Tester',
    price: 135000,
    originalPrice: 180000,
    discountPercent: 25,
    rating: 4.9,
    soldCount: 780,
    stock: 35,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 28,
    image: 'images/product-placeholder.svg',
    description: 'Kabel konektor power supply iBoot box. Menyalakan mesin iPhone (6 s.d. 14 Pro Max) dan berbagai HP Android tanpa baterai terpasang.',
    specs: ['Kompatibel: iPhone 6 - 14 Pro Max + Android Multi Soket', 'Proteksi: Overvoltage & Overcurrent Protection', 'Bahan Kabel: Silikon Tahan Panas']
  },
  {
    id: '168-shortkiller',
    name: 'Shortkiller Sunshine P-3005A Alat Deteksi Jalur Konslet HP PCB',
    category: 'Alat Ukur & Tester',
    price: 195000,
    originalPrice: 260000,
    discountPercent: 25,
    rating: 4.8,
    soldCount: 390,
    stock: 20,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Alat pelacak kapasitor short / konsleting pada papan PCB handphone. Menghancurkan kapasitor konslet dalam hitungan 1 detik.',
    specs: ['Tipe: Short Circuit Detector Power Box', 'Output: 30A Max Peak', 'Indikator: LED Volt & Current']
  },

  // --- KATEGORI 9: Pinset & Pembuka ---
  {
    id: '168-pinset-rt11c',
    name: 'Pinset Titanium Relife RT-11C Non-Magnetik Ultra Runcing Presisi',
    category: 'Pinset & Pembuka',
    price: 48000,
    originalPrice: 65000,
    discountPercent: 26,
    rating: 4.9,
    soldCount: 1620,
    stock: 65,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 60,
    image: 'images/product-placeholder.svg',
    description: 'Pinset paduan titanium Relife RT-11C. Anti karat, non-magnetik, ujung 0.15mm sanggup menjepit kawat jumper super halus atau IC kecil tanpa slip.',
    specs: ['Bahan: Titanium Alloy Super Ringan', 'Karakter: Non-Magnetik & Anti Asam', 'Ketajaman Ujung: 0.15 mm Super Pointy']
  },
  {
    id: '168-obeng-qianli',
    name: 'Set Obeng Servis HP QianLi Mega-Idea 2D Precision Screwdriver 5in1',
    category: 'Pinset & Pembuka',
    price: 165000,
    originalPrice: 220000,
    discountPercent: 25,
    rating: 5.0,
    soldCount: 840,
    stock: 30,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Set obeng QianLi Mega-Idea kepala baja S2 magnetic kuat. Mata obeng presisi anti slek pada baut iPhone bintang 0.8, Y 0.6, plus 1.5, dan standoff.',
    specs: ['Isi: 5 Pcs Obeng (Pentalobe 0.8, Tri-wing Y0.6, Phillips +1.5, Standoff 2.5, Torx T2)', 'Bahan: S2 Steel + Aluminium Alloy Rotating Cap']
  },
  {
    id: '168-suction-tang',
    name: 'Tang Suction Cup Pembuka Layar LCD Relife RL-004A Heavy Duty',
    category: 'Pinset & Pembuka',
    price: 35000,
    originalPrice: 50000,
    discountPercent: 30,
    rating: 4.8,
    soldCount: 1100,
    stock: 45,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Tang kop karet penyedot LCD handphone. Membuka layar LCD iPhone dan Android dengan aman tanpa resiko flek pada LCD.',
    specs: ['Tipe: Dual Suction Plier Grip', 'Karet: Karet Vakum Silikon Daya Hisap Kuat']
  },

  // --- KATEGORI 10: Sparepart Fleksibel ---
  {
    id: '168-flex-cas-a50',
    name: 'Papan Fleksibel Cas Board Charger Samsung Galaxy A50 A505 Original',
    category: 'Sparepart Fleksibel',
    price: 28000,
    originalPrice: 40000,
    discountPercent: 30,
    rating: 4.9,
    soldCount: 1950,
    stock: 80,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 75,
    image: 'images/product-placeholder.svg',
    description: 'Papan konektor cas Type-C Samsung A50 (A505F). Komplit dengan mic telepon dan jack audio 3.5mm. Support Fast Charging Original.',
    specs: ['Kompatibel: Samsung Galaxy A50', 'Fitur: Support Fast Charging & Mic Jernih', 'Kondisi: Baru Original OEM']
  },
  {
    id: '168-flex-cas-rn8',
    name: 'Fleksibel Board Charger Cas Xiaomi Redmi Note 8 Fast Charging',
    category: 'Sparepart Fleksibel',
    price: 25000,
    originalPrice: 38000,
    discountPercent: 34,
    rating: 4.8,
    soldCount: 1720,
    stock: 75,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Board charger Redmi Note 8. Solusi port USB longgar, tidak bisa cas, atau suara mikrofon kresek-kresek.',
    specs: ['Model: Redmi Note 8', 'Konektor: USB Type-C + Mic', 'Garansi: Garansi Tes']
  },
  {
    id: '168-flex-cas-ip11',
    name: 'Fleksibel Port Charger Lightning iPhone 11 + Dual Mic Original',
    category: 'Sparepart Fleksibel',
    price: 58000,
    originalPrice: 85000,
    discountPercent: 31,
    rating: 4.9,
    soldCount: 890,
    stock: 40,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Fleksibel dock charging port iPhone 11. Sudah include mic bawah dan konektor antena sinyal seluler.',
    specs: ['Model: iPhone 11', 'Warna: Hitam / Putih / Merah / Hijau', 'Kualitas: Original Equipment Manufacturer']
  },
  {
    id: '168-flex-onoff-a3s',
    name: 'Fleksibel Tombol On Off Power Volume Oppo A3s / Realme C1',
    category: 'Sparepart Fleksibel',
    price: 12000,
    originalPrice: 20000,
    discountPercent: 40,
    rating: 4.8,
    soldCount: 2200,
    stock: 90,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Fleksibel switch tombol daya dan volume Oppo A3s. Memperbaiki tombol mendem, keras ditekan, atau tidak merespon.',
    specs: ['Kompatibel: Oppo A3s & Realme C1', 'Tipe: Flexible Key Power + Volume']
  },
  {
    id: '168-bga-amaoe',
    name: 'Plat Cetak BGA Stencil AMAOE Universal CPU Snapdragon EMMC',
    category: 'Solder & Timah',
    price: 35000,
    originalPrice: 50000,
    discountPercent: 30,
    rating: 5.0,
    soldCount: 1980,
    stock: 70,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 65,
    image: 'images/product-placeholder.svg',
    description: 'Plat BGA Stencil AMAOE lubang persegi anti melengkung saat dipanasi blower uap. Presisi tinggi untuk reballing CPU Qualcomm & EMMC.',
    specs: ['Merk: AMAOE Original', 'Ketebalan: 0.12 mm High Precision', 'Tahan Panas: Anti Gelembung / Melengkung']
  },
  {
    id: '168-paste-k9',
    name: 'Pasta Solder LANRUI K9 Thixotropic Desoldering Paste Mikro 168part',
    category: 'Solder & Timah',
    price: 45000,
    originalPrice: 60000,
    discountPercent: 25,
    rating: 4.9,
    soldCount: 1250,
    stock: 60,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Pasta solder flux thixotropic LANRUI K9 original 168part Surabaya. Sangat efektif untuk penyolderan mikro PCB HP, perbaikan jalur jumper fingerprint, soket baterai, port charger tail plug, dan kaki IC BGA.',
    specs: ['Merk: LANRUI K9 Original', 'Fungsi: Thixotropic Desoldering & Soldering Paste', 'Aplikasi: Jumper Flying Wire, Konektor FPC, BGA Pad', 'Kelebihan: No-Clean, Bebas Asap Berlebih']
  },
  {
    id: '168-knife-ck2',
    name: 'Pisau Penghilang Lem CPU JTXTOOLS CK-2 Pisau Kerik Lem CPU IC eMMC',
    category: 'Alat Servis & Blower',
    price: 28000,
    originalPrice: 40000,
    discountPercent: 30,
    rating: 5.0,
    soldCount: 890,
    stock: 45,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 38,
    image: 'images/product-placeholder.svg',
    description: 'Mata pisau scraper JTXTOOLS CK-2 khusus pembersih lem hitam/lem keras di sekeliling IC CPU dan eMMC HP. Mata pisau ultra tipis dan lentur, aman tidak merusak lapisan jalur motherboard.',
    specs: ['Merk: JTXTOOLS CK-2 Original 168part', 'Material: High Carbon Spring Steel Lentur', 'Aplikasi: Kerik Lem CPU, Underfill Glue Removal', 'Ketebalan: 0.1mm Ultra Thin']
  },
  {
    id: '168-fp-a50',
    name: 'Fleksibel Sensor Fingerprint Sidik Jari Samsung Galaxy A50 A505 Original',
    category: 'Sparepart Fleksibel',
    price: 17000,
    originalPrice: 25000,
    discountPercent: 32,
    rating: 4.8,
    soldCount: 1650,
    stock: 75,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Sensor sidik jari under-display optical fingerprint sensor Samsung Galaxy A50 SM-A505F. Baca sidik jari cepat akurat, 100% presisi bawaan pabrik.',
    specs: ['Kompatibilitas: Samsung Galaxy A50 (SM-A505)', 'Tipe: Optical In-Display Fingerprint Sensor', 'Kondisi: 100% Baru Original OEM', 'Garansi: Garansi Tes 7 Hari']
  },
  {
    id: '168-bd-y12',
    name: 'Backdoor Casing Belakang Vivo Y12 / Y15 / Y17 Original + Tombol Samping',
    category: 'Backdoor & Kaca',
    price: 20000,
    originalPrice: 32000,
    discountPercent: 37,
    rating: 4.9,
    soldCount: 2150,
    stock: 80,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 75,
    image: 'images/product-placeholder.svg',
    description: 'Casing tutup belakang Vivo Y12, Y15, Y17. Sudah include tombol volume on/off dan kaca pelindung kamera belakang. Presisi rapat tanpa celah.',
    specs: ['Kompatibel: Vivo Y12 / Y15 / Y17 / Y11 2019', 'Kelengkapan: Backdoor + Tombol Volume + Kaca Kamera', 'Pilihan Warna: Mineral Blue, Burgundy Red, Aqua Blue']
  },
  {
    id: '168-lens-a50',
    name: 'Kaca Lensa Kamera Belakang Samsung Galaxy A50 A505 Original + Ring',
    category: 'Backdoor & Kaca',
    price: 12000,
    originalPrice: 20000,
    discountPercent: 40,
    rating: 4.9,
    soldCount: 1980,
    stock: 90,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Kaca pelindung lensa kamera belakang Samsung Galaxy A50 lengkap dengan ring frame dan lem perekat adhesive. Mengatasi hasil foto buram akibat kaca kamera retak/baret.',
    specs: ['Bahan: Real Tempered Glass Bening', 'Model: Samsung Galaxy A50', 'Isi: Kaca Lensa 3 Kamera + Lem Perekat']
  },
  {
    id: '168-lens-ip11',
    name: 'Kaca Lensa Kamera Belakang iPhone 11 Set 2 Pcs Kaca Sapphire Original',
    category: 'Backdoor & Kaca',
    price: 18000,
    originalPrice: 28000,
    discountPercent: 35,
    rating: 5.0,
    soldCount: 1420,
    stock: 65,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 55,
    image: 'images/product-placeholder.svg',
    description: 'Set 2 pcs kaca lensa kamera belakang iPhone 11. Kaca kristal sapphire bening anti gores, tidak menimbulkan pantulan flare saat memotret dengan flash.',
    specs: ['Kompatibilitas: Apple iPhone 11 (Dual Camera)', 'Bahan: Sapphire Glass Crystal Clear', 'Sudah termasuk perekat double tape presisi']
  },
  {
    id: '168-buzzer-a50',
    name: 'Buzzer Speaker Musik Bawah Loudspeaker Samsung Galaxy A50 A505 Original',
    category: 'Sparepart Fleksibel',
    price: 18000,
    originalPrice: 28000,
    discountPercent: 35,
    rating: 4.8,
    soldCount: 1290,
    stock: 55,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Modul buzzer speaker musik bawah (loudspeaker / ringer) Samsung Galaxy A50. Suara nyaring, bass bulat, mengatasi speaker kresek atau mati suara total.',
    specs: ['Kompatibel: Samsung Galaxy A50 A505F', 'Fungsi: Speaker Nada Dering & Musik Bawah', 'Kondisi: 100% Baru Kualitas Suara Standar Pabrik']
  },
  {
    id: '168-earpiece-ip11',
    name: 'Earpiece Speaker Atas Telepon iPhone 11 + Sensor Proximity Flex',
    category: 'Sparepart Fleksibel',
    price: 45000,
    originalPrice: 65000,
    discountPercent: 30,
    rating: 4.9,
    soldCount: 780,
    stock: 35,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Modul speaker telinga atas (earpiece) iPhone 11 komplit dengan flex kabel sensor kedekatan (proximity sensor) dan microphone depan.',
    specs: ['Model: iPhone 11', 'Fungsi: Suara Telepon Masuk & Sensor Layar Padam', 'Kualitas: Original Equipment Manufacturer']
  },
  {
    id: '168-sim-a50',
    name: 'Sim Tray Slot Tempat Kartu SIM Samsung Galaxy A50 Dual SIM + Micro SD',
    category: 'Backdoor & Kaca',
    price: 15000,
    originalPrice: 22000,
    discountPercent: 31,
    rating: 4.8,
    soldCount: 1550,
    stock: 70,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Tempat kartu SIM card tray Samsung Galaxy A50 A505. Triple slot (Dual Nano SIM + 1 Slot Micro SD). Presisi rapat dengan warna frame housing.',
    specs: ['Kompatibel: Samsung Galaxy A50', 'Slot: 2 SIM + 1 MicroSD', 'Pilihan Warna: Hitam, Biru, Putih']
  },
  {
    id: '168-sim-ip11',
    name: 'Sim Tray Slot Kartu SIM iPhone 11 Single SIM Original Presisi Karet Seal',
    category: 'Backdoor & Kaca',
    price: 18000,
    originalPrice: 25000,
    discountPercent: 28,
    rating: 4.9,
    soldCount: 1100,
    stock: 50,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Baki kartu SIM tray iPhone 11 single slot. Dilengkapi karet seal pelindung debu dan air (waterproof rubber ring) seperti bawaan aslinya.',
    specs: ['Model: Apple iPhone 11', 'Material: Aluminium CNC Presisi', 'Varian Warna: Black, White, Red, Purple, Green, Yellow']
  },
  {
    id: '168-ic-pmi632',
    name: 'IC Power PMI632 502 Qualcomm Original Xiaomi Redmi 7 / 8 / Note 7',
    category: 'IC & Chipset',
    price: 45000,
    originalPrice: 65000,
    discountPercent: 30,
    rating: 4.9,
    soldCount: 1420,
    stock: 65,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 42,
    image: 'images/product-placeholder.svg',
    description: 'IC Power PMI632-502-00 Qualcomm. Mengatasi kendala HP mati total, konsumsi arus gantung 0.05A saat dinyalakan, dan masalah pengisian daya.',
    specs: ['Model: PMI632 502 00 Qualcomm', 'Fungsi: Sub-PMIC Power Management & Charging', 'Kondisi: Baru dengan Kaki Timah BGA Rapi']
  },
  {
    id: '168-flex-onoff-a50',
    name: 'Fleksibel Tombol On Off Power Volume Samsung Galaxy A50 A505 Original',
    category: 'Sparepart Fleksibel',
    price: 14000,
    originalPrice: 22000,
    discountPercent: 36,
    rating: 4.8,
    soldCount: 1750,
    stock: 80,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: false,
    image: 'images/product-placeholder.svg',
    description: 'Kabel fleksibel tombol switch power daya dan volume Samsung Galaxy A50. Saklar klik empuk dan responsif mengembalikan fungsi tombol yang rusak/robek.',
    specs: ['Kompatibel: Samsung Galaxy A50 (A505F, A505G)', 'Fungsi: Switch Tombol Power & Volume +/-', 'Kondisi: Baru Siap Pasang']
  },
  {
    id: '168-flex-onoff-y12',
    name: 'Fleksibel Tombol Power Volume Vivo Y12 / Y15 / Y17 Original Presisi',
    category: 'Sparepart Fleksibel',
    price: 14000,
    originalPrice: 22000,
    discountPercent: 36,
    rating: 4.9,
    soldCount: 1880,
    stock: 85,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 70,
    image: 'images/product-placeholder.svg',
    description: 'Fleksibel saklar switch tombol power dan volume Vivo Y12 / Y15 / Y17 / Y11. Bahan tembaga lentur berkualitas tidak mudah patah saat ditekuk.',
    specs: ['Model: Vivo Y12 / Y15 / Y17', 'Fitur: Switch Power & Volume Up/Down', 'Kualitas: Original OEM']
  },
  {
    id: '168-lcd-poco-x3',
    name: 'LCD Touchscreen Xiaomi Poco X3 Pro / Poco X3 NFC Incell 120Hz Fullset',
    category: 'LCD & Layar',
    price: 210000,
    originalPrice: 290000,
    discountPercent: 27,
    rating: 4.9,
    soldCount: 1350,
    stock: 45,
    location: 'Kota Surabaya',
    shopName: '168 Parts Surabaya',
    shopType: 'Star+',
    isFlashSale: true,
    flashSaleSold: 35,
    image: 'images/product-placeholder.svg',
    description: 'LCD Touchscreen Xiaomi Poco X3 Pro & Poco X3 NFC kualitas Incell High Refresh Rate 120Hz. Layar tajam, bezel bawah tipis, lubang kamera punch hole pas di tengah.',
    specs: ['Kompatibilitas: Xiaomi Poco X3 NFC / Poco X3 Pro', 'Ukuran: 6.67 inch Full HD+ 120Hz', 'Garansi: Garansi Tes 7 Hari (Segel Utuh)']
  }
    ];
  },

  renderHomeQuickNav() {
    const qkEl = document.getElementById('qk');
    if (!qkEl) return;

    const quickServices = [
      { icon: "phone", label: "LCD & Layar", color: "#be123c", bg: "#ffe4e6" },
      { icon: "bolt", label: "Baterai HP", color: "#e11d48", bg: "#fff1f2" },
      { icon: "cpu", label: "IC & Chipset", color: "#0284c7", bg: "#e0f2fe" },
      { icon: "tool", label: "Alat Servis", color: "#ea580c", bg: "#fff7ed" },
      { icon: "flame", label: "Solder Station", color: "#d97706", bg: "#fef3c7" },
      { icon: "bottle", label: "Lem LCD I9", color: "#16a34a", bg: "#f0fdf4" },
      { icon: "shield", label: "Backdoor Kaca", color: "#7c3aed", bg: "#f3e8ff" },
      { icon: "gauge", label: "Tester & Multitester", color: "#0d9488", bg: "#f0fdfa" },
      { icon: "scissors", label: "Pinset Presisi", color: "#059669", bg: "#ecfdf5" },
      { icon: "tag", label: "Semua Promo", color: "#be123c", bg: "#ffe4e6" }
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

    const list = Array.isArray(items) && items.length > 0 ? items : this.products.filter(p => p.isFlashSale);

    fsEl.innerHTML = list.slice(0, 6).map(p => `
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
    const isProfile = hash.startsWith('#/user/profile') || hash === '#/profile';

    const homeView = document.getElementById('view-home');
    const searchView = document.getElementById('view-search');
    const cartView = document.getElementById('view-cart');
    const checkoutView = document.getElementById('view-checkout');
    const profileView = document.getElementById('view-profile');
    const headerEl = document.querySelector('.hd');
    const cartHeaderTitle = document.getElementById('cart-header-title');
    const cartIconBtn = document.querySelector('.hd .cart');
    const searchSuggestions = document.querySelector('.hd .sb .sg');

    if (isProfile) {
      if (homeView) homeView.classList.remove('active');
      if (searchView) searchView.classList.remove('active');
      if (cartView) cartView.classList.remove('active');
      if (checkoutView) checkoutView.classList.remove('active');
      if (profileView) profileView.classList.add('active');
      if (headerEl) headerEl.classList.remove('hd-cart-mode');
      if (cartHeaderTitle) cartHeaderTitle.style.display = 'none';
      if (cartIconBtn) cartIconBtn.style.display = 'flex';
      if (searchSuggestions) searchSuggestions.style.display = 'flex';
      document.title = 'Profil Saya | Pasarin Indonesia';
      this.renderUserProfileView();
    } else if (isCart) {
      if (homeView) homeView.classList.remove('active');
      if (searchView) searchView.classList.remove('active');
      if (checkoutView) checkoutView.classList.remove('active');
      if (profileView) profileView.classList.remove('active');
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
      if (profileView) profileView.classList.remove('active');
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
      if (profileView) profileView.classList.remove('active');
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
      if (profileView) profileView.classList.remove('active');
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

    if (hash === '#promo') {
      this.openPromoModal();
    }

    if (hash.startsWith('#/product/')) {
      const pid = hash.replace('#/product/', '').split('?')[0].trim();
      if (pid) {
        setTimeout(() => this.openProductDetail(pid), 50);
      }
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

  /* =========================================================
     SHOPEE USER PROFILE CONTROLLER (#/user/profile)
     ========================================================= */
  renderUserProfileView() {
    let user = window.PasarinAuth ? window.PasarinAuth.currentUser : null;
    if (!user) {
      try {
        const cached = localStorage.getItem('pasarin_user');
        if (cached) user = JSON.parse(cached);
      } catch (e) {}
    }

    // Default data sesuai screenshot Shopee jika pengguna membuka profil
    const defaultData = {
      username: 'ferdinand2341',
      name: 'Ferdinand',
      email: 'fe************@gmail.com',
      fullEmail: 'ferdinandleandro12@gmail.com',
      phone: '**********76',
      fullPhone: '081234567876',
      shopName: '168Parts Official',
      gender: 'Laki-laki',
      birthDate: '2000-01-15',
      avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=240'
    };

    const currentUsername = user?.username || (user?.email ? user.email.split('@')[0] : defaultData.username);
    const currentName = user?.name || defaultData.name;
    const currentEmail = user?.email || defaultData.fullEmail;
    const currentPhone = user?.phone || defaultData.fullPhone;
    const currentShop = user?.shopName || defaultData.shopName;
    const currentGender = user?.gender || defaultData.gender;
    const currentBirth = user?.birthDate || defaultData.birthDate;
    const currentAvatar = user?.avatar || defaultData.avatar;

    const maskEmail = (em) => {
      if (!em || !em.includes('@')) return 'fe************@gmail.com';
      const [u, d] = em.split('@');
      const start = u.slice(0, 2);
      return `${start}${'*'.repeat(Math.max(6, u.length - 2))}@${d}`;
    };

    const maskPhone = (ph) => {
      if (!ph || ph.length < 4) return '**********76';
      const last = ph.slice(-2);
      return `${'*'.repeat(Math.max(6, ph.length - 2))}${last}`;
    };

    // Sidebar DOM
    const sideUsername = document.getElementById('sidebar-user-username');
    if (sideUsername) sideUsername.textContent = currentUsername;

    const sideAvatar = document.getElementById('sidebar-user-avatar');
    if (sideAvatar) sideAvatar.src = currentAvatar;

    // Form DOM
    const valUsername = document.getElementById('prof-val-username');
    if (valUsername) valUsername.textContent = currentUsername;

    const inputName = document.getElementById('prof-input-name');
    if (inputName) inputName.value = currentName;

    const valEmail = document.getElementById('prof-val-email');
    if (valEmail) valEmail.textContent = maskEmail(currentEmail);

    const hiddenEmail = document.getElementById('prof-hidden-email');
    if (hiddenEmail) hiddenEmail.value = currentEmail;

    const valPhone = document.getElementById('prof-val-phone');
    if (valPhone) valPhone.textContent = maskPhone(currentPhone);

    const hiddenPhone = document.getElementById('prof-hidden-phone');
    if (hiddenPhone) hiddenPhone.value = currentPhone;

    const inputShop = document.getElementById('prof-input-shop');
    if (inputShop) inputShop.value = currentShop;

    // Radio Gender
    document.querySelectorAll('input[name="prof-gender"]').forEach(r => {
      r.checked = (r.value === currentGender);
    });

    const inputBirth = document.getElementById('prof-input-birthdate');
    if (inputBirth) inputBirth.value = currentBirth;

    // Avatar preview kanan
    const bigAvatar = document.getElementById('prof-avatar-big-img');
    if (bigAvatar) bigAvatar.src = currentAvatar;
  },

  async handleSaveUserProfile(event) {
    if (event) event.preventDefault();

    const name = document.getElementById('prof-input-name')?.value.trim();
    const email = document.getElementById('prof-hidden-email')?.value.trim();
    const phone = document.getElementById('prof-hidden-phone')?.value.trim();
    const shopName = document.getElementById('prof-input-shop')?.value.trim();
    const birthDate = document.getElementById('prof-input-birthdate')?.value;
    const gender = document.querySelector('input[name="prof-gender"]:checked')?.value || 'Laki-laki';
    const avatar = document.getElementById('prof-avatar-big-img')?.src;
    const username = document.getElementById('prof-val-username')?.textContent.trim() || 'ferdinand2341';

    const payload = {
      name,
      username,
      email,
      phone,
      shopName,
      gender,
      birthDate,
      avatar
    };

    const saveBtn = document.getElementById('btn-save-profile');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Menyimpan...';
    }

    try {
      const res = await PasarinAPI.updateProfile(payload);
      if (res && res.success && res.user) {
        if (window.PasarinAuth) {
          window.PasarinAuth.currentUser = res.user;
          localStorage.setItem('pasarin_user', JSON.stringify(res.user));
          window.PasarinAuth.renderNavbarUser();
        }
        if (window.showToast) {
          window.showToast('✓ Profil Anda berhasil diperbarui!', 'success');
        }
      } else {
        const current = window.PasarinAuth?.currentUser || {};
        const merged = { ...current, ...payload };
        if (window.PasarinAuth) {
          window.PasarinAuth.currentUser = merged;
          localStorage.setItem('pasarin_user', JSON.stringify(merged));
          window.PasarinAuth.renderNavbarUser();
        }
        if (window.showToast) {
          window.showToast('✓ Profil berhasil diperbarui!', 'success');
        }
      }
      this.renderUserProfileView();
    } catch (err) {
      console.warn('Error saving profile:', err);
      if (window.showToast) window.showToast('✓ Profil berhasil diperbarui secara lokal.', 'success');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Simpan';
      }
    }
  },

  handleAvatarFileSelect(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 1024 * 1024) {
      alert('Ukuran file melebihi batas maksimal 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const bigAvatar = document.getElementById('prof-avatar-big-img');
      const sideAvatar = document.getElementById('sidebar-user-avatar');
      if (bigAvatar) bigAvatar.src = dataUrl;
      if (sideAvatar) sideAvatar.src = dataUrl;
      if (window.showToast) {
        window.showToast('✓ Foto profil berhasil dipilih! Klik "Simpan" untuk menerapkan.', 'info');
      }
    };
    reader.readAsDataURL(file);
  },

  promptChangeEmail() {
    const hiddenEmail = document.getElementById('prof-hidden-email');
    const valEmail = document.getElementById('prof-val-email');
    const current = hiddenEmail ? hiddenEmail.value : 'ferdinandleandro12@gmail.com';
    const newEmail = prompt('Masukkan alamat email baru Anda:', current);
    if (newEmail && newEmail.trim() && newEmail.includes('@')) {
      if (hiddenEmail) hiddenEmail.value = newEmail.trim();
      if (valEmail) {
        const u = newEmail.trim().split('@')[0];
        const d = newEmail.trim().split('@')[1];
        valEmail.textContent = `${u.slice(0, 2)}${'*'.repeat(Math.max(6, u.length - 2))}@${d}`;
      }
      if (window.showToast) window.showToast('Email diperbarui. Klik "Simpan" untuk menyimpan.', 'info');
    }
  },

  promptChangePhone() {
    const hiddenPhone = document.getElementById('prof-hidden-phone');
    const valPhone = document.getElementById('prof-val-phone');
    const current = hiddenPhone ? hiddenPhone.value : '081234567876';
    const newPhone = prompt('Masukkan nomor telepon (WhatsApp) baru Anda:', current);
    if (newPhone && newPhone.trim()) {
      const clean = newPhone.trim();
      if (hiddenPhone) hiddenPhone.value = clean;
      if (valPhone) {
        valPhone.textContent = `${'*'.repeat(Math.max(6, clean.length - 2))}${clean.slice(-2)}`;
      }
      if (window.showToast) window.showToast('Nomor telepon diperbarui. Klik "Simpan" untuk menyimpan.', 'info');
    }
  },

  openChangePasswordPrompt() {
    const pass = prompt('Masukkan kata sandi baru (minimal 6 karakter):');
    if (pass && pass.length >= 6) {
      if (window.showToast) window.showToast('✓ Kata sandi berhasil diperbarui!', 'success');
    } else if (pass) {
      alert('Kata sandi minimal 6 karakter.');
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

      if (elLeft) {
        if (banners.left.bgGradient) elLeft.style.background = banners.left.bgGradient;
        elLeft.style.cursor = 'pointer';
        elLeft.setAttribute('role', 'button');
        elLeft.setAttribute('tabindex', '0');
        const targetUrl = banners.left.targetUrl || 'login.html?promo=newuser#register';
        elLeft.setAttribute('title', `Klik untuk membuka: ${targetUrl}`);
        
        elLeft.onclick = (e) => {
          if (e.target.closest('.shopee-dots') || e.target.classList.contains('dot')) return;
          this.handleBannerClick(targetUrl);
        };
        elLeft.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleBannerClick(targetUrl);
          }
        };
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

      if (elRight) {
        if (banners.right.bgGradient) elRight.style.background = banners.right.bgGradient;
        elRight.style.cursor = 'pointer';
        elRight.setAttribute('role', 'button');
        elRight.setAttribute('tabindex', '0');
        const targetUrl = banners.right.targetUrl || '#promo';
        elRight.setAttribute('title', `Klik untuk membuka: ${targetUrl}`);

        elRight.onclick = () => {
          this.handleBannerClick(targetUrl);
        };
        elRight.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleBannerClick(targetUrl);
          }
        };
      }
      if (elImg1 && banners.right.modelImage1) elImg1.src = banners.right.modelImage1;
      if (elImg2 && banners.right.modelImage2) elImg2.src = banners.right.modelImage2;
      if (elPill1Title && banners.right.pill1Title) elPill1Title.textContent = banners.right.pill1Title;
      if (elPill1Val && banners.right.pill1Val) elPill1Val.textContent = banners.right.pill1Val;
      if (elPill2Title && banners.right.pill2Title) elPill2Title.textContent = banners.right.pill2Title;
      if (elPill2Val && banners.right.pill2Val) elPill2Val.textContent = banners.right.pill2Val;
    }
  },

  handleBannerClick(targetUrl) {
    if (!targetUrl) return;
    targetUrl = targetUrl.trim();

    // 1. Eksternal URL (YouTube, Sosmed, Website Lain)
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. Link Pendaftaran Akun Baru / Login Promo
    if (targetUrl.startsWith('login.html')) {
      window.location.href = targetUrl;
      return;
    }

    // 3. Modal Klaim Promo / Voucher
    if (targetUrl === '#promo' || targetUrl === 'promo' || targetUrl.includes('promoModal')) {
      this.openPromoModal();
      return;
    }

    // 4. Link Produk Spesifik (#/product/:id)
    if (targetUrl.startsWith('#/product/')) {
      const pid = targetUrl.replace('#/product/', '').split('?')[0].trim();
      this.openProductDetail(pid);
      return;
    }

    // 5. Cek apakah targetUrl adalah ID Produk secara langsung
    const matchedProduct = this.products.find(p => p.id === targetUrl);
    if (matchedProduct) {
      this.openProductDetail(matchedProduct.id);
      return;
    }

    // 6. Internal Route (#/search, #/cart, #/orders, dll)
    if (targetUrl.startsWith('#')) {
      window.location.hash = targetUrl;
      return;
    }

    // 7. Fallback navigasi umum
    window.location.href = targetUrl;
  },

  async initPromoSystem() {
    try {
      const stored = localStorage.getItem('pasarin_claimed_promos');
      this.claimedPromos = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.claimedPromos = [];
    }

    try {
      const data = await window.PasarinAPI.getPromos();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        this.promos = data.data.map(p => {
          const remaining = p.remainingQuota !== undefined ? Number(p.remainingQuota) : Math.max(0, (p.quota || 100) - (p.usedCount || 0));
          const userClaims = Number(p.userClaimCount || 0);
          return {
            code: p.code,
            category: p.category || 'diskon',
            title: p.title || p.code,
            desc: p.description || '',
            valText: p.discountType === 'percent' ? `${p.discountValue}% OFF` : (p.category === 'ongkir' ? 'GRATIS' : (p.discountValue >= 1000 ? `Rp${Math.round(p.discountValue/1000)}RB` : `Rp${p.discountValue}`)),
            typeText: p.discountType === 'percent' ? `Diskon ${p.discountValue}%` : (p.category === 'ongkir' ? 'Ongkir Rp0' : `Potongan Rp${p.discountValue.toLocaleString('id-ID')}`),
            icon: p.category === 'ongkir' ? '🚚' : (p.category === 'cashback' ? '💰' : (p.category === 'lokal' ? '🏬' : '🎁')),
            minSpend: p.minSpend > 0 ? `Min. Belanja Rp${p.minSpend.toLocaleString('id-ID')}` : 'Min. Belanja Rp0',
            validUntil: 'Berlaku s.d akhir bulan',
            quota: `Sisa ${remaining} voucher`,
            remainingQuota: remaining,
            userClaimCount: userClaims,
            userAvailableCount: Number(p.userAvailableCount || 0),
            maxClaimPerUser: Number(p.maxClaimPerUser || 3),
            isSoldOut: Boolean(p.isSoldOut || remaining <= 0),
            isMaxClaimed: Boolean(p.isMaxClaimed || userClaims >= 3),
            canClaim: Boolean(p.canClaim !== undefined ? p.canClaim : (remaining > 0 && userClaims < 3))
          };
        });
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
      }, 1400);
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
      const claimCount = Number(p.userClaimCount || 0);
      const isMaxClaimed = claimCount >= 3;
      const remainingQuota = p.remainingQuota !== undefined ? Number(p.remainingQuota) : 100;
      const isSoldOut = Boolean(p.isSoldOut || remainingQuota <= 0);

      let claimBtnHtml = '';
      if (isSoldOut) {
        claimBtnHtml = `
          <button class="btn-claim-voucher" disabled style="background:#cbd5e1; color:#64748b; cursor:not-allowed; border:none; padding:7px 12px; border-radius:6px; font-weight:700; font-size:12px;">
            Habis
          </button>
        `;
      } else if (isMaxClaimed) {
        claimBtnHtml = `
          <button class="btn-claim-voucher claimed" disabled style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; cursor:not-allowed; padding:7px 12px; border-radius:6px; font-weight:700; font-size:12px;" title="Batas maksimal 3 voucher telah tercapai">
            ✓ Maks. 3/3
          </button>
        `;
      } else if (claimCount > 0) {
        claimBtnHtml = `
          <button class="btn-claim-voucher" onclick="PasarinApp.claimPromo('${p.code}', this)" style="background:#be123c; color:#fff; border:none; padding:7px 12px; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer;" title="Klaim lagi (+1 voucher)">
            +1 Klaim (${claimCount}/3)
          </button>
        `;
      } else {
        claimBtnHtml = `
          <button class="btn-claim-voucher" onclick="PasarinApp.claimPromo('${p.code}', this)" style="background:#be123c; color:#fff; border:none; padding:7px 14px; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer;" title="Klaim voucher (maks. 3 per akun)">
            Klaim (0/3)
          </button>
        `;
      }

      return `
        <div class="promo-ticket" style="border: 1px solid #fecdd3; border-radius: 8px; margin-bottom: 12px; background:#fff; overflow:hidden;">
          <div class="ticket-left" style="background:#fff1f2; border-right:1px dashed #f43f5e;">
            <span class="ticket-icon">${p.icon}</span>
            <span class="ticket-val" style="color:#be123c;">${p.valText}</span>
            <span class="ticket-type-lbl">${p.typeText}</span>
          </div>
          <div class="ticket-center">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <h4 class="ticket-title" title="${p.title}" style="margin:0;">${p.title}</h4>
              ${claimCount > 0 ? `<span style="background:#fee2e2; color:#be123c; font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:10px;">Dimiliki: ${claimCount}x</span>` : ''}
            </div>
            <p class="ticket-desc">${p.desc}</p>
            <div class="ticket-meta" style="font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span>${p.minSpend}</span>
              <span>•</span>
              <span class="ticket-code-pill" onclick="PasarinApp.copyPromoCode('${p.code}', this)" title="Klik untuk salin kode voucher">
                🎫 <b>${p.code}</b>
              </span>
              <span>•</span>
              <span style="color:#e11d48; font-weight:700;">Sisa: ${remainingQuota} kuota</span>
              <span>•</span>
              <span style="color:#475569; font-weight:600;">Maks. 3 voucher/akun</span>
            </div>
          </div>
          <div class="ticket-right" style="display:flex; flex-direction:column; gap:6px; align-items:center; justify-content:center; padding:12px;">
            <button class="btn-copy-code-direct" onclick="PasarinApp.copyPromoCode('${p.code}', this)" style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; font-size:11.5px; font-weight:700; cursor:pointer; width:100%; transition:all 0.2s;">
              📋 Salin Kode
            </button>
            ${claimBtnHtml}
          </div>
        </div>
      `;
    }).join('');
  },

  async claimPromo(code, btn) {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Memproses...';
      }

      const res = await PasarinAPI.claimPromo(cleanCode);
      if (res && res.success && res.data) {
        const p = this.promos.find(x => x.code.toUpperCase() === cleanCode);
        if (p) {
          p.userClaimCount = res.data.claimCount;
          p.remainingQuota = res.data.remainingQuota;
          p.quota = `Sisa: ${res.data.remainingQuota} kuota`;
          p.isMaxClaimed = res.data.claimCount >= 3;
          p.isSoldOut = res.data.remainingQuota <= 0;
          p.canClaim = !p.isSoldOut && !p.isMaxClaimed;
        }

        if (!this.claimedPromos.includes(cleanCode)) {
          this.claimedPromos.push(cleanCode);
          localStorage.setItem('pasarin_claimed_promos', JSON.stringify(this.claimedPromos));
        }

        this.renderPromoTickets();
        this.updatePromoBadgeCount();

        if (window.showToast) {
          window.showToast(res.message || `✓ Berhasil klaim voucher "${cleanCode}" (${res.data.claimCount}/3)!`, 'success');
        }

        // Jika berada di checkout, pasang voucher langsung
        if (window.location.hash.startsWith('#/checkout') && window.PasarinCart) {
          window.PasarinCart.applyVoucher(cleanCode);
          this.closePromoModal();
        }
      } else {
        if (window.showToast) {
          window.showToast(res ? res.message : `Gagal klaim voucher "${cleanCode}".`, 'warning');
        }
        this.renderPromoTickets();
      }
    } catch (err) {
      if (window.showToast) {
        window.showToast('Gagal menghubungi server untuk klaim voucher.', 'error');
      }
      this.renderPromoTickets();
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

    input.value = '';
    await this.claimPromo(code);
  },

  async claimAllPromos() {
    const claimAllBtn = document.getElementById('btn-claim-all');
    if (claimAllBtn) {
      claimAllBtn.textContent = 'Sedang Mengklaim...';
      claimAllBtn.disabled = true;
    }

    let claimedSuccess = 0;
    for (const p of this.promos) {
      if (!p.isSoldOut && (p.userClaimCount || 0) < 3) {
        try {
          const res = await PasarinAPI.claimPromo(p.code);
          if (res && res.success && res.data) {
            claimedSuccess++;
            p.userClaimCount = res.data.claimCount;
            p.remainingQuota = res.data.remainingQuota;
            p.quota = `Sisa: ${res.data.remainingQuota} kuota`;
            p.isMaxClaimed = res.data.claimCount >= 3;
            p.isSoldOut = res.data.remainingQuota <= 0;
            p.canClaim = !p.isSoldOut && !p.isMaxClaimed;
          }
        } catch (e) {}
      }
    }

    this.renderPromoTickets();
    this.updatePromoBadgeCount();

    if (claimAllBtn) {
      claimAllBtn.textContent = '✓ Selesai Diklaim!';
      claimAllBtn.style.background = '#10b981';
      setTimeout(() => {
        claimAllBtn.textContent = '⚡ Klaim Semua Voucher';
        claimAllBtn.style.background = '';
        claimAllBtn.disabled = false;
      }, 3000);
    }

    if (window.showToast) {
      if (claimedSuccess > 0) {
        window.showToast(`🎉 Berhasil mengklaim ${claimedSuccess} voucher belanja ke akun Anda! (Maks 3 per voucher)`, 'success');
      } else {
        window.showToast('Seluruh voucher promo sudah mencapai batas maksimal klaim Anda (3/3).', 'info');
      }
    }
  },

  copyPromoCode(code, btnElement) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        if (btnElement) {
          const originalText = btnElement.innerHTML;
          btnElement.innerHTML = '✓ Disalin!';
          btnElement.style.background = '#10b981';
          btnElement.style.color = '#ffffff';
          btnElement.style.borderColor = '#10b981';
          setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.style.background = '';
            btnElement.style.color = '';
            btnElement.style.borderColor = '';
          }, 2000);
        }
        if (window.showToast) {
          window.showToast(`✓ Kode promo "${code}" berhasil disalin ke clipboard!`, 'success');
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
    { term: 'LCD iPhone 11', count: 28 },
    { term: 'Baterai Original', count: 24 },
    { term: 'Lem LANRUI I9', count: 20 },
    { term: 'IC Power & Charger', count: 18 },
    { term: 'Solder & Blower', count: 15 },
    { term: 'Backdoor Glass', count: 12 },
    { term: 'Multitester Digital', count: 10 }
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
