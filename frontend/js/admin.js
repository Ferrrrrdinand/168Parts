/* =========================================================
   168 Parts Surabaya - Admin Dashboard Controller
   Live CRUD, Realtime Analytics, Order & Stock Management
   ========================================================= */

const AdminApp = {
  products: [],
  orders: [],
  promos: [],
  banners: null,
  customers: [],
  currentTab: 'overview',
  activeEditingId: null,
  activeEditingPromoCode: null,
  currentUser: null,

  async init() {
    this.bindEvents();

    // Jalankan pengecekan status database real-time (Hijau = Connected, Merah = Disconnected)
    this.checkDbHealth(false);
    setInterval(() => this.checkDbHealth(false), 20000);

    const isAuthed = await this.checkAdminAuth();
    if (!isAuthed) {
      this.showAuthGate();
      return;
    }

    this.hideAuthGate();
    await this.loadAllDashboardData();
  },

  async checkAdminAuth() {
    const token = window.PasarinAPI ? window.PasarinAPI.getToken() : localStorage.getItem('pasarin_token');
    if (!token) return false;

    try {
      const res = await this.authFetch('/auth/me');
      const data = await res.json();
      if (data && data.success && data.user && data.user.role === 'admin') {
        this.currentUser = data.user;
        const nameEl = document.getElementById('topbar-admin-name');
        if (nameEl) nameEl.textContent = data.user.name || 'Admin 168 Parts';
        const roleEl = document.getElementById('topbar-admin-role');
        if (roleEl) roleEl.textContent = 'Kanal Penjual & Admin (168 Parts)';
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  showAuthGate(errorMessage = '') {
    const gate = document.getElementById('admin-auth-gate');
    const sidebar = document.getElementById('admin-sidebar');
    const mainWrap = document.querySelector('.admin-main-wrap');

    if (gate) gate.classList.remove('hidden');
    if (sidebar) sidebar.style.display = 'none';
    if (mainWrap) mainWrap.style.display = 'none';

    const alertEl = document.getElementById('admin-gate-alert');
    if (alertEl) {
      if (errorMessage) {
        alertEl.textContent = errorMessage;
        alertEl.style.display = 'block';
      } else {
        alertEl.style.display = 'none';
      }
    }
  },

  hideAuthGate() {
    const gate = document.getElementById('admin-auth-gate');
    const sidebar = document.getElementById('admin-sidebar');
    const mainWrap = document.querySelector('.admin-main-wrap');

    if (gate) gate.classList.add('hidden');
    if (sidebar) sidebar.style.display = '';
    if (mainWrap) mainWrap.style.display = '';
  },

  async handleGateLogin(event) {
    if (event) event.preventDefault();
    const emailInput = document.getElementById('gate-admin-email');
    const passInput = document.getElementById('gate-admin-password');
    const alertEl = document.getElementById('admin-gate-alert');
    const submitBtn = document.getElementById('btn-gate-submit');

    const email = (emailInput?.value || '').trim();
    const password = passInput?.value || '';

    if (!email || !password) {
      if (alertEl) {
        alertEl.textContent = 'Harap masukkan email dan kata sandi admin.';
        alertEl.style.display = 'block';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Memverifikasi akun admin...';
    }

    try {
      let res;
      try {
        res = await fetch(`${window.PasarinAPI.baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      } catch (netErr) {
        if (window.PasarinAPI && (window.PasarinAPI.baseUrl.includes('localhost:3000') || window.PasarinAPI.baseUrl.includes('127.0.0.1:3000'))) {
          console.info('[Admin] Server lokal port 3000 offline. Mengalihkan ke Cloud API Vercel.');
          window.PasarinAPI.baseUrl = 'https://partonesixeight.vercel.app/api';
          res = await fetch(`${window.PasarinAPI.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
        } else {
          throw netErr;
        }
      }

      let data;
      const cType = res.headers.get('content-type') || '';
      if (cType.includes('application/json')) {
        data = await res.json();
      } else {
        const errText = await res.text();
        if (res.status === 404) {
          throw new Error('Endpoint backend API tidak ditemukan (404). Pastikan server backend /api aktif.');
        } else {
          throw new Error(`Server error (${res.status}): ${errText.slice(0, 100)}`);
        }
      }

      if (!data.success) {
        throw new Error(data.message || 'Email atau kata sandi admin salah.');
      }

      if (data.user && data.user.role !== 'admin') {
        throw new Error('Akses ditolak: Akun ini bukan akun Admin / Penjual 168 Parts.');
      }

      // Simpan sesi login admin / seller
      if (window.PasarinAPI) {
        window.PasarinAPI.setToken(data.token);
      } else {
        localStorage.setItem('pasarin_token', data.token);
      }
      localStorage.setItem('pasarin_user', JSON.stringify(data.user));
      this.currentUser = data.user;

      const nameEl = document.getElementById('topbar-admin-name');
      if (nameEl) nameEl.textContent = data.user.name;

      this.hideAuthGate();
      await this.loadAllDashboardData();
      this.showToast(`✅ Berhasil masuk sebagai ${data.user.name}! Mode kelola & edit aktif.`);
    } catch (err) {
      if (alertEl) {
        alertEl.textContent = err.message;
        alertEl.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🔐 Masuk ke Dashboard';
      }
    }
  },

  fillAdminCredentials() {
    const emailInput = document.getElementById('gate-admin-email');
    const passInput = document.getElementById('gate-admin-password');
    if (emailInput) emailInput.value = 'admin@168parts.com';
    if (passInput) passInput.value = 'admin123';
  },

  toggleGatePassword() {
    const passInput = document.getElementById('gate-admin-password');
    if (passInput) {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
    }
  },

  async handleAdminLogout() {
    const confirmed = await this.confirmModal({
      title: 'Keluar dari Sesi Administrator?',
      message: 'Apakah Anda yakin ingin mengakhiri sesi login Admin 168 Parts?',
      subtext: 'Anda akan dialihkan kembali ke portal login toko. Semua data yang tersimpan di cloud Supabase tetap aman.',
      icon: '🚪',
      confirmText: 'Ya, Logout Sekarang',
      cancelText: 'Tetap di Admin',
      isDanger: true
    });

    if (confirmed) {
      if (window.PasarinAPI) window.PasarinAPI.setToken(null);
      localStorage.removeItem('pasarin_token');
      localStorage.removeItem('pasarin_user');
      this.currentUser = null;
      this.showAuthGate();
      this.showToast('👋 Sesi Administrator telah berakhir.');
    }
  },

  async authFetch(endpoint, options = {}) {
    const token = window.PasarinAPI ? window.PasarinAPI.getToken() : localStorage.getItem('pasarin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      return await fetch(`${window.PasarinAPI.baseUrl}${endpoint}`, {
        ...options,
        headers
      });
    } catch (netErr) {
      if (window.PasarinAPI && (window.PasarinAPI.baseUrl.includes('localhost:3000') || window.PasarinAPI.baseUrl.includes('127.0.0.1:3000'))) {
        window.PasarinAPI.baseUrl = 'https://partonesixeight.vercel.app/api';
        return await fetch(`${window.PasarinAPI.baseUrl}${endpoint}`, {
          ...options,
          headers
        });
      }
      throw netErr;
    }
  },

  async loadAllDashboardData() {
    await this.fetchProducts();
    await this.fetchOrders();
    await this.fetchCustomers();
    await this.fetchPromos();
    await this.fetchBanners();
    this.updateStats();
    this.renderProductsTable();
    this.renderOrdersTable();
    this.renderCustomersTable();
    this.renderPromosTable();
    this.populateBannerForm();
    this.renderOverviewRecent();
  },

  bindEvents() {
    // Sidebar Navigation Tabs
    const navItems = document.querySelectorAll('.sidebar-nav-item[data-tab]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Mobile Sidebar Toggle
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('admin-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Product Search & Category Filter
    const searchInput = document.getElementById('admin-prod-search');
    const catSelect = document.getElementById('admin-prod-category');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderProductsTable());
    }
    if (catSelect) {
      catSelect.addEventListener('change', () => this.renderProductsTable());
    }

    // Order Status Filter
    const orderFilter = document.getElementById('admin-order-status-filter');
    if (orderFilter) {
      orderFilter.addEventListener('change', () => this.renderOrdersTable());
    }

    // Promo Search & Category Filter
    const promoSearch = document.getElementById('admin-promo-search');
    const promoCat = document.getElementById('admin-promo-cat-filter');
    if (promoSearch) {
      promoSearch.addEventListener('input', () => this.renderPromosTable());
    }
    if (promoCat) {
      promoCat.addEventListener('change', () => this.renderPromosTable());
    }

    // Customer Search, Filter & Sort
    const custSearch = document.getElementById('admin-cust-search');
    const custFilter = document.getElementById('admin-cust-filter');
    const custSort = document.getElementById('admin-cust-sort');
    if (custSearch) {
      custSearch.addEventListener('input', () => this.renderCustomersTable());
    }
    if (custFilter) {
      custFilter.addEventListener('change', () => this.renderCustomersTable());
    }
    if (custSort) {
      custSort.addEventListener('change', () => this.renderCustomersTable());
    }
  },

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update Nav Item Active State
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-tab') === tabName);
    });

    // Update Panes
    document.querySelectorAll('.admin-tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    const targetPane = document.getElementById(`pane-${tabName}`);
    if (targetPane) targetPane.classList.add('active');

    // Update Topbar Title
    const titleEl = document.getElementById('topbar-page-title');
    if (titleEl) {
      const titles = {
        overview: '📊 Ringkasan & Analisis Penjualan',
        products: '📦 Manajemen & Katalog Produk',
        orders: '📑 Daftar Pesanan & Pengiriman',
        customers: '👥 Data Akun Pelanggan & Member 168',
        banners: '🎨 Pengaturan & Desain Banner Toko',
        promos: '🎟️ Kelola Voucher & Kode Promo'
      };
      titleEl.textContent = titles[tabName] || 'Dashboard Admin';
    }

    if (tabName === 'banners') {
      this.populateBannerProductSelects();
      this.populateBannerForm();
    }

    // Auto close sidebar on mobile
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar && window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    }
  },

  async fetchProducts() {
    try {
      const res = await this.authFetch('/products');
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        this.products = data.data;
      }
    } catch (e) {
      console.warn('Gagal fetch /api/products, gunakan fallback', e);
      if (!this.products.length) {
        this.products = [
          { id: '168-lcd-ip11', name: 'LCD Touchscreen iPhone 11 Incell True Tone Grade A+', category: 'LCD & Layar', price: 245000, stock: 45, soldCount: 1420, isFlashSale: true, image: 'images/product-placeholder.svg' },
          { id: '168-bat-ip11', name: 'Baterai iPhone 11 Original High Capacity 3110mAh', category: 'Baterai HP', price: 145000, stock: 35, soldCount: 980, isFlashSale: true, image: 'images/product-placeholder.svg' },
          { id: '168-ic-pm8953', name: 'IC Power PM8953 Original New Xiaomi / Oppo / Vivo', category: 'IC & Chipset', price: 28000, stock: 150, soldCount: 3200, isFlashSale: false, image: 'images/product-placeholder.svg' },
          { id: '168-blower-857dw', name: 'Quick 857DW+ Blower Uap Panas SMD Rework Station Original', category: 'Alat Servis & Blower', price: 795000, stock: 12, soldCount: 420, isFlashSale: true, image: 'images/product-placeholder.svg' }
        ];
      }
    }
  },

  async fetchOrders() {
    try {
      const res = await this.authFetch('/orders/all');
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        this.orders = data.data;
      }
    } catch (e) {
      console.warn('Gagal fetch /api/orders/all', e);
    }
  },

  async fetchPromos() {
    try {
      const res = await this.authFetch('/promos/all');
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        this.promos = data.data;
      }
    } catch (e) {
      console.warn('Gagal fetch /api/promos/all', e);
    }
  },

  async fetchCustomers() {
    try {
      const res = await this.authFetch('/auth/customers');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.customers)) {
        this.customers = data.customers;
      }
    } catch (e) {
      console.warn('Gagal fetch /api/auth/customers', e);
    }
  },

  updateStats() {
    const totalProdEl = document.getElementById('stat-total-products');
    const totalOrdersEl = document.getElementById('stat-total-orders');
    const totalRevEl = document.getElementById('stat-total-revenue');
    const totalFlashEl = document.getElementById('stat-total-flash');

    const totalRev = this.orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const flashCount = this.products.filter(p => p.isFlashSale).length;

    if (totalProdEl) totalProdEl.textContent = this.products.length;
    if (totalOrdersEl) totalOrdersEl.textContent = this.orders.length;
    if (totalRevEl) totalRevEl.textContent = 'Rp' + totalRev.toLocaleString('id-ID');
    if (totalFlashEl) totalFlashEl.textContent = flashCount;

    // Promo Stats
    const totalVouchersEl = document.getElementById('stat-total-vouchers');
    const activeVouchersEl = document.getElementById('stat-active-vouchers');
    const inactiveVouchersEl = document.getElementById('stat-inactive-vouchers');
    const usedVouchersEl = document.getElementById('stat-used-vouchers');

    const activeCount = this.promos.filter(p => p.isActive).length;
    const inactiveCount = this.promos.filter(p => !p.isActive).length;
    const totalUsed = this.promos.reduce((acc, p) => acc + (p.usedCount || 0), 0);

    if (totalVouchersEl) totalVouchersEl.textContent = this.promos.length;
    if (activeVouchersEl) activeVouchersEl.textContent = activeCount;
    if (inactiveVouchersEl) inactiveVouchersEl.textContent = inactiveCount;
    if (usedVouchersEl) usedVouchersEl.textContent = totalUsed;

    // Customer Stats
    const totalCustEl = document.getElementById('stat-cust-total');
    const buyersCustEl = document.getElementById('stat-cust-buyers');
    const pointsCustEl = document.getElementById('stat-cust-points');
    const spentCustEl = document.getElementById('stat-cust-spent');

    const buyersCount = this.customers.filter(c => Number(c.totalOrders || 0) > 0).length;
    const totalPoints = this.customers.reduce((acc, c) => acc + (Number(c.points) || 0), 0);
    const totalSpent = this.customers.reduce((acc, c) => acc + (Number(c.totalSpent) || 0), 0);

    if (totalCustEl) totalCustEl.textContent = this.customers.length;
    if (buyersCustEl) buyersCustEl.textContent = buyersCount;
    if (pointsCustEl) pointsCustEl.textContent = totalPoints.toLocaleString('id-ID');
    if (spentCustEl) spentCustEl.textContent = 'Rp' + totalSpent.toLocaleString('id-ID');

    // Badge di sidebar
    const prodBadge = document.getElementById('badge-prod-count');
    const orderBadge = document.getElementById('badge-order-count');
    const promoBadge = document.getElementById('badge-promo-count');
    const custBadge = document.getElementById('badge-customer-count');
    if (prodBadge) prodBadge.textContent = this.products.length;
    if (orderBadge) orderBadge.textContent = this.orders.length;
    if (promoBadge) promoBadge.textContent = this.promos.length;
    if (custBadge) custBadge.textContent = this.customers.length;
  },

  renderOverviewRecent() {
    const tbody = document.getElementById('overview-recent-orders-tbody');
    if (!tbody) return;

    const recent = this.orders.slice(0, 5);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Belum ada pesanan masuk</td></tr>`;
      return;
    }

    tbody.innerHTML = recent.map(o => {
      const itemsSummary = (o.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ') || 'Item Pesanan';
      const statusBadge = this.getStatusBadge(o.status);

      return `
        <tr>
          <td><span style="font-weight:700; color:#1d3f0d;">${o.id}</span></td>
          <td><b>${o.customerName || 'Pelanggan'}</b></td>
          <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsSummary}">${itemsSummary}</td>
          <td><b>Rp${Number(o.totalAmount || 0).toLocaleString('id-ID')}</b></td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  },

  renderProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    const q = (document.getElementById('admin-prod-search')?.value || '').toLowerCase();
    const cat = document.getElementById('admin-prod-category')?.value || 'Semua';

    let list = this.products.filter(p => {
      const matchQ = p.name.toLowerCase().includes(q) || (p.id && p.id.toLowerCase().includes(q));
      const matchCat = cat === 'Semua' || (p.category && p.category.toLowerCase() === cat.toLowerCase());
      return matchQ && matchCat;
    });

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">Tidak ada produk yang cocok dengan pencarian</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((p, idx) => {
      const discount = p.discountPercent || (p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0);
      const stockBadge = p.stock > 10 
        ? `<span class="badge-status badge-success">${p.stock} Tersedia</span>` 
        : `<span class="badge-status badge-warning">${p.stock} Menipis</span>`;

      return `
        <tr>
          <td>
            <div class="prod-cell">
              <img src="${p.image || 'images/product-placeholder.svg'}" alt="${p.name}" class="prod-thumb" onerror="this.src='images/product-placeholder.svg'">
              <div class="prod-meta">
                <span class="prod-name" title="${p.name}">${p.name}</span>
                <span class="prod-id">${p.id}</span>
              </div>
            </div>
          </td>
          <td><span style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-weight:600;">${p.category || 'Umum'}</span></td>
          <td><b>Rp${Number(p.price).toLocaleString('id-ID')}</b></td>
          <td>${discount > 0 ? `<span style="color:#dc2626; font-weight:800;">-${discount}%</span>` : '-'}</td>
          <td>${stockBadge}</td>
          <td>${Number(p.soldCount || 0).toLocaleString('id-ID')}</td>
          <td>
            <label class="toggle-switch">
              <input type="checkbox" ${p.isFlashSale ? 'checked' : ''} onchange="AdminApp.toggleFlashSale('${p.id}', this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </td>
          <td>
            <div class="action-btns">
              <button class="btn-action-icon" title="Edit Produk" onclick="AdminApp.openEditModal('${p.id}')">✏️</button>
              <button class="btn-action-icon btn-delete" title="Hapus Produk" onclick="AdminApp.deleteProduct('${p.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderOrdersTable() {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    const filterStatus = document.getElementById('admin-order-status-filter')?.value || 'Semua';

    let list = this.orders;
    if (filterStatus === 'Retur') {
      list = list.filter(o => o.returnStatus && o.returnStatus !== 'none');
    } else if (filterStatus !== 'Semua') {
      list = list.filter(o => o.status === filterStatus);
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">Tidak ada pesanan pada status ini</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(o => {
      const itemsText = (o.items || []).map(i => `${i.name} (x${i.quantity})`).join('<br>') || '-';
      const dateFormatted = new Date(o.createdAt || Date.now()).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const arrivedDateFormatted = o.arrivedAt ? new Date(o.arrivedAt).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      }) : null;

      let returnBadgeHtml = '';
      if (o.returnStatus === 'pending') {
        returnBadgeHtml = `
          <button type="button" onclick="AdminApp.openReturnReviewModal('${o.id}')" style="margin-top:6px; background:#fff1f2; color:#be123c; border:1px solid #fecdd3; padding:4px 8px; border-radius:5px; font-size:11px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px; box-shadow:0 1px 3px rgba(190,18,60,0.15);">
            <span>🔄</span>
            <span>Review Bukti Retur</span>
          </button>
        `;
      } else if (o.returnStatus === 'approved') {
        returnBadgeHtml = `
          <button type="button" onclick="AdminApp.openReturnReviewModal('${o.id}')" style="margin-top:4px; background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700; cursor:pointer; display:inline-block;">
            ✅ Retur Disetujui
          </button>
        `;
      } else if (o.returnStatus === 'rejected') {
        returnBadgeHtml = `
          <button type="button" onclick="AdminApp.openReturnReviewModal('${o.id}')" style="margin-top:4px; background:#f8fafc; color:#64748b; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700; cursor:pointer; display:inline-block;">
            ❌ Retur Ditolak
          </button>
        `;
      }

      return `
        <tr>
          <td>
            <span style="font-weight:700; color:#1d3f0d;">${o.id}</span>
            <br><small style="color:#94a3b8;">${dateFormatted}</small>
          </td>
          <td><b>${o.customerName || 'Pelanggan 168 Parts'}</b></td>
          <td style="font-size:12px; line-height:1.4;">${itemsText}</td>
          <td><b>Rp${Number(o.totalAmount || 0).toLocaleString('id-ID')}</b></td>
          <td><span style="color:#059669; font-weight:800;">+${o.earnedPoints || Math.floor((o.totalAmount||0)/1000)} Pts</span></td>
          <td>
            <select class="admin-select" style="font-size:11.5px; padding:4px 8px;" onchange="AdminApp.updateOrderStatus('${o.id}', this.value)">
              <option value="Sedang Diproses" ${o.status === 'Sedang Diproses' ? 'selected' : ''}>⏳ Diproses</option>
              <option value="Sedang Dikirim" ${o.status === 'Sedang Dikirim' ? 'selected' : ''}>🚚 Dikirim</option>
              <option value="Sampai di Tujuan" ${o.status === 'Sampai di Tujuan' ? 'selected' : ''}>📦 Sampai di Tujuan</option>
              <option value="Selesai" ${o.status === 'Selesai' ? 'selected' : ''}>✅ Selesai</option>
              <option value="Dibatalkan" ${o.status === 'Dibatalkan' ? 'selected' : ''}>❌ Dibatalkan</option>
            </select>
            ${arrivedDateFormatted ? `<small style="color:#059669; font-weight:700; display:block; margin-top:3px; font-size:10.5px;">✓ Tiba: ${arrivedDateFormatted}</small>` : ''}
            ${returnBadgeHtml}
          </td>
          <td>
            <span style="font-size:12px; color:#64748b;">${o.paymentMethod || 'Transfer'}</span>
          </td>
        </tr>
      `;
    }).join('');
  },

  getStatusBadge(status) {
    if (status === 'Selesai') return `<span class="badge-status badge-success">✅ Selesai</span>`;
    if (status === 'Sedang Dikirim') return `<span class="badge-status badge-info">🚚 Dikirim</span>`;
    if (status === 'Sedang Diproses') return `<span class="badge-status badge-warning">⏳ Diproses</span>`;
    return `<span class="badge-status badge-danger">❌ ${status || 'Pending'}</span>`;
  },

  /* =========================================================
     SISTEM EKSPOR DATA PENJUALAN (EXCEL CSV & CETAK REKAP)
     ========================================================= */
  exportSalesCSV() {
    if (!this.orders || this.orders.length === 0) {
      alert('Tidak ada data pesanan/penjualan untuk diekspor.');
      return;
    }

    const headers = [
      'No. Pesanan',
      'Tanggal Transaksi',
      'Nama Pembeli',
      'Rincian Produk',
      'Jumlah Item',
      'Metode Pembayaran',
      'Alamat Pengiriman',
      'Voucher Digunakan',
      'Diskon Voucher (Rp)',
      'Poin Ditukar (Rp)',
      'Total Belanja (Rp)',
      'Poin Didapat',
      'Status Pesanan'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = this.orders.map(o => {
      const dateFormatted = new Date(o.createdAt || Date.now()).toLocaleDateString('id-ID', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });

      const itemsSummary = (o.items || [])
        .map(i => `${i.name} (x${i.quantity || 1} @Rp${Number(i.price || 0).toLocaleString('id-ID')})`)
        .join('; ');

      const totalQty = (o.items || []).reduce((sum, i) => sum + Number(i.quantity || 1), 0);

      return [
        escapeCsv(o.id),
        escapeCsv(dateFormatted),
        escapeCsv(o.customerName || 'Pelanggan 168 Parts'),
        escapeCsv(itemsSummary),
        escapeCsv(totalQty),
        escapeCsv(o.paymentMethod || 'Transfer Bank'),
        escapeCsv(o.shippingAddress || '-'),
        escapeCsv(o.promoCode || '-'),
        escapeCsv(Number(o.discountAmount || 0)),
        escapeCsv(Number(o.redeemedPoints || 0)),
        escapeCsv(Number(o.totalAmount || 0)),
        escapeCsv(Number(o.earnedPoints || 0)),
        escapeCsv(o.status || 'Sedang Diproses')
      ].join(',');
    });

    const totalRevenue = this.orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    const summaryRow = [
      escapeCsv('TOTAL PENJUALAN'),
      escapeCsv(''),
      escapeCsv(`${this.orders.length} Transaksi`),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(totalRevenue),
      escapeCsv(''),
      escapeCsv('')
    ].join(',');

    // UTF-8 BOM (\uFEFF) untuk kompatibilitas sempurna dengan Microsoft Excel di Windows
    const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Penjualan_168Parts_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(`📊 Berhasil mengekspor ${this.orders.length} data penjualan ke file Excel (CSV)!`);
  },

  printSalesReport() {
    if (!this.orders || this.orders.length === 0) {
      alert('Tidak ada data pesanan/penjualan untuk dicetak.');
      return;
    }

    const totalRevenue = this.orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const rowsHtml = this.orders.map((o, idx) => {
      const itemsList = (o.items || []).map(i => `<div>• ${i.name} <b>(x${i.quantity || 1})</b> - Rp${Number(i.price || 0).toLocaleString('id-ID')}</div>`).join('');
      const dateStr = new Date(o.createdAt || Date.now()).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px;"><b>${o.id}</b><br><small style="color:#64748b;">${dateStr}</small></td>
          <td style="padding: 10px;">${o.customerName || 'Pelanggan'}<br><small style="color:#64748b;">${o.paymentMethod || 'Transfer'}</small></td>
          <td style="padding: 10px; font-size: 12px;">${itemsList || '-'}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #be123c;">Rp${Number(o.totalAmount || 0).toLocaleString('id-ID')}</td>
          <td style="padding: 10px; text-align: center;"><span style="background:#f1f5f9; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">${o.status}</span></td>
        </tr>
      `;
    }).join('');

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Popup diblokir oleh browser. Mohon izinkan popup untuk mencetak laporan.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Laporan Penjualan - 168 Parts Surabaya</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 24px; margin: 0; }
          .header { border-bottom: 2px solid #be123c; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { color: #be123c; font-size: 22px; font-weight: 800; }
          .sub { font-size: 12px; color: #64748b; margin-top: 2px; }
          .kpi-box { display: flex; gap: 16px; margin-bottom: 20px; }
          .kpi-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; flex: 1; }
          .kpi-title { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; }
          .kpi-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
          th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 8px;">
          <button onclick="window.print()" style="background:#be123c; color:#fff; border:none; padding:8px 18px; font-weight:700; border-radius:6px; cursor:pointer;">🖨️ Cetak / Simpan PDF</button>
          <button onclick="window.close()" style="background:#e2e8f0; color:#334155; border:none; padding:8px 14px; font-weight:600; border-radius:6px; cursor:pointer;">Tutup</button>
        </div>

        <div class="header">
          <div>
            <div class="brand">168 PARTS SURABAYA</div>
            <div class="sub">Pusat Sparepart & Alat Servis HP • Kanal Penjual & Admin</div>
            <div class="sub">Dicetak pada: ${printDate}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; font-size: 16px; color: #be123c;">REKAP PENJUALAN TOKO</div>
            <div style="font-size: 12px; color: #64748b;">Periode: Seluruh Transaksi Penjualan</div>
          </div>
        </div>

        <div class="kpi-box">
          <div class="kpi-item">
            <div class="kpi-title">Total Pendapatan (Omzet)</div>
            <div class="kpi-val" style="color: #be123c;">Rp${totalRevenue.toLocaleString('id-ID')}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-title">Total Transaksi Selesai</div>
            <div class="kpi-val">${this.orders.length} Pesanan</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-title">Rata-rata Nilai Order</div>
            <div class="kpi-val">Rp${Math.round(totalRevenue / Math.max(1, this.orders.length)).toLocaleString('id-ID')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">No</th>
              <th>No. Pesanan / Tanggal</th>
              <th>Pelanggan</th>
              <th>Rincian Produk</th>
              <th style="text-align: right;">Total Transaksi</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #fff1f2; font-weight: bold;">
              <td colspan="4" style="padding: 12px; text-align: right; color: #9f1239;">TOTAL KESELURUHAN PENDAPATAN:</td>
              <td style="padding: 12px; text-align: right; color: #be123c; font-size: 15px;">Rp${totalRevenue.toLocaleString('id-ID')}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 14px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between;">
          <span>Sistem Resmi Seller Centre 168 Parts Surabaya</span>
          <span>Dokumen otomatis digenerate dari Supabase Cloud</span>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  async toggleFlashSale(prodId, isFlash) {
    const p = this.products.find(x => x.id === prodId);
    if (!p) return;
    p.isFlashSale = isFlash;

    try {
      await this.authFetch(`/products/${prodId}`, {
        method: 'PUT',
        body: JSON.stringify({ isFlashSale: isFlash })
      });
      this.showToast(`Status Flash Sale produk "${p.name.slice(0, 20)}..." diperbarui!`);
      this.updateStats();
    } catch (e) {
      console.error(e);
    }
  },

  /* =========================================================
     KALKULASI OTOMATIS HARGA ASLI, DISKON PERSEN & HARGA POTONGAN
     ========================================================= */
  calcDiscountFromPercent() {
    const origInput = document.getElementById('f-prod-orig-price');
    const pctInput = document.getElementById('f-prod-discount-percent');
    const priceInput = document.getElementById('f-prod-price');

    const origPrice = Number(origInput?.value) || 0;
    let pct = Number(pctInput?.value) || 0;
    if (pct < 0) pct = 0;
    if (pct > 99) pct = 99;

    if (origPrice > 0) {
      if (pct > 0) {
        // Hitung harga potongan setelah diskon
        const finalPrice = Math.max(0, Math.round(origPrice * (1 - pct / 100)));
        if (priceInput) priceInput.value = finalPrice;
      } else {
        // Tanpa diskon (0%), harga potongan = harga asli
        if (priceInput) priceInput.value = origPrice;
      }
    }
    this.updatePricePreview();
  },

  calcDiscountFromPrice() {
    const origInput = document.getElementById('f-prod-orig-price');
    const pctInput = document.getElementById('f-prod-discount-percent');
    const priceInput = document.getElementById('f-prod-price');

    const origPrice = Number(origInput?.value) || 0;
    const finalPrice = Number(priceInput?.value) || 0;

    if (origPrice > 0 && finalPrice > 0 && origPrice > finalPrice) {
      const pct = Math.round(((origPrice - finalPrice) / origPrice) * 100);
      if (pctInput) pctInput.value = pct;
    } else if (origPrice > 0 && finalPrice >= origPrice) {
      if (pctInput) pctInput.value = 0;
    }
    this.updatePricePreview();
  },

  updatePricePreview() {
    const origInput = document.getElementById('f-prod-orig-price');
    const pctInput = document.getElementById('f-prod-discount-percent');
    const priceInput = document.getElementById('f-prod-price');

    const origPrice = Number(origInput?.value) || 0;
    const finalPrice = Number(priceInput?.value) || 0;
    const pct = Number(pctInput?.value) || 0;

    const elStrike = document.getElementById('preview-strikethrough-price');
    const elFinal = document.getElementById('preview-discounted-price');
    const elBadge = document.getElementById('preview-discount-badge');
    const elSaving = document.getElementById('preview-saving-pill');

    const formatRp = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

    const displayPrice = finalPrice > 0 ? finalPrice : origPrice;
    if (elFinal) {
      elFinal.textContent = formatRp(displayPrice);
    }

    if (origPrice > 0 && (pct > 0 || (finalPrice > 0 && finalPrice < origPrice))) {
      const effectivePct = pct > 0 ? pct : Math.round(((origPrice - displayPrice) / origPrice) * 100);
      const savings = Math.max(0, origPrice - displayPrice);

      if (elStrike) {
        elStrike.textContent = formatRp(origPrice);
        elStrike.style.display = 'inline';
      }
      if (elBadge && effectivePct > 0) {
        elBadge.textContent = `-${effectivePct}%`;
        elBadge.style.display = 'inline-block';
      }
      if (elSaving && savings > 0) {
        elSaving.textContent = `Hemat ${formatRp(savings)}`;
        elSaving.style.display = 'inline-block';
      }
    } else {
      if (elStrike) elStrike.style.display = 'none';
      if (elBadge) elBadge.style.display = 'none';
      if (elSaving) elSaving.style.display = 'none';
    }
  },

  openAddModal() {
    this.activeEditingId = null;
    document.getElementById('modal-product-title').textContent = 'Tambah Produk Baru';
    document.getElementById('form-product').reset();
    document.getElementById('f-prod-orig-price').value = '';
    document.getElementById('f-prod-discount-percent').value = '';
    document.getElementById('f-prod-price').value = '';
    document.getElementById('prod-img-preview').src = 'images/product-placeholder.svg';
    this.updatePricePreview();
    document.getElementById('admin-modal-product').classList.add('active');
  },

  openEditModal(prodId) {
    const p = this.products.find(x => x.id === prodId);
    if (!p) return;

    this.activeEditingId = prodId;
    document.getElementById('modal-product-title').textContent = 'Edit Informasi Produk';
    document.getElementById('f-prod-name').value = p.name || '';
    document.getElementById('f-prod-category').value = p.category || 'LCD & Layar';
    
    // Inisialisasi Harga Asli, Persentase Diskon, dan Harga Potongan
    const origPrice = p.originalPrice || p.price || 0;
    const finalPrice = p.price || 0;
    const discountPercent = p.discountPercent || (origPrice > finalPrice ? Math.round(((origPrice - finalPrice) / origPrice) * 100) : 0);

    document.getElementById('f-prod-orig-price').value = origPrice || '';
    document.getElementById('f-prod-discount-percent').value = discountPercent > 0 ? discountPercent : '';
    document.getElementById('f-prod-price').value = finalPrice || '';

    document.getElementById('f-prod-stock').value = p.stock || 20;
    document.getElementById('f-prod-image').value = p.image || '';
    document.getElementById('f-prod-shop').value = p.shopName || '168 Parts Surabaya';
    document.getElementById('f-prod-location').value = p.location || 'Kota Surabaya';
    document.getElementById('f-prod-flash').checked = !!p.isFlashSale;
    document.getElementById('prod-img-preview').src = p.image || 'images/product-placeholder.svg';

    this.updatePricePreview();
    document.getElementById('admin-modal-product').classList.add('active');
  },

  closeModal() {
    document.getElementById('admin-modal-product').classList.remove('active');
  },

  async handleSaveProduct(event) {
    event.preventDefault();
    const name = document.getElementById('f-prod-name').value.trim();
    const category = document.getElementById('f-prod-category').value;
    const originalPrice = Number(document.getElementById('f-prod-orig-price').value) || null;
    let price = Number(document.getElementById('f-prod-price').value);
    let discountPercent = Number(document.getElementById('f-prod-discount-percent').value) || 0;

    // Jika harga potongan belum terisi tapi harga asli dan diskon terisi
    if (!price && originalPrice) {
      price = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;
    }

    if (originalPrice && price && originalPrice > price && !discountPercent) {
      discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    const stock = Number(document.getElementById('f-prod-stock').value) || 10;
    const image = document.getElementById('f-prod-image').value.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500';
    const shopName = document.getElementById('f-prod-shop').value.trim() || '168 Parts Surabaya';
    const location = document.getElementById('f-prod-location').value.trim() || 'Kota Surabaya';
    const isFlashSale = document.getElementById('f-prod-flash').checked;

    const payload = {
      name, category, price, originalPrice, discountPercent, stock, image, shopName, location, isFlashSale
    };

    try {
      if (this.activeEditingId) {
        // UPDATE (PUT)
        const res = await this.authFetch(`/products/${this.activeEditingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          const idx = this.products.findIndex(x => x.id === this.activeEditingId);
          if (idx !== -1) this.products[idx] = { ...this.products[idx], ...payload };
          this.showToast('✅ Produk berhasil diperbarui!');
        } else {
          alert(data.message || 'Gagal memperbarui produk.');
        }
      } else {
        // CREATE (POST)
        const res = await this.authFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && (data.data || data.product)) {
          this.products.unshift(data.data || data.product);
          this.showToast('🎉 Produk baru berhasil ditambahkan!');
        } else {
          alert(data.message || 'Gagal menambahkan produk.');
        }
      }

      this.closeModal();
      this.updateStats();
      this.renderProductsTable();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan produk ke server.');
    }
  },

  async deleteProduct(prodId) {
    const p = this.products.find(x => x.id === prodId);
    const confirmed = await this.confirmModal({
      title: 'Hapus Produk dari Katalog?',
      message: `Hapus "${p ? p.name : prodId}" dari etalase toko?`,
      subtext: 'Produk akan dihapus permanen dari database Supabase dan tidak lagi dapat dibeli pelanggan.',
      icon: '🗑️',
      confirmText: 'Ya, Hapus Produk',
      cancelText: 'Batal',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      const res = await this.authFetch(`/products/${prodId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        this.products = this.products.filter(x => x.id !== prodId);
        this.showToast('🗑️ Produk berhasil dihapus dari database!');
        this.updateStats();
        this.renderProductsTable();
      } else {
        alert(data.message || 'Gagal menghapus produk.');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus produk.');
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      const res = await this.authFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        const o = this.orders.find(x => x.id === orderId);
        if (o) {
          o.status = newStatus;
          if (data.order && data.order.arrivedAt) {
            o.arrivedAt = data.order.arrivedAt;
          }
        }
        this.showToast(`Status pesanan ${orderId} diubah ke: ${newStatus}`);
        this.renderOverviewRecent();
        this.renderOrdersTable();
      }
    } catch (e) {
      console.error(e);
    }
  },

  /* ---------------- ADMIN: REVIEW PENGEMBALIAN BARANG ---------------- */
  async openReturnReviewModal(orderId) {
    const modal = document.getElementById('admin-modal-return-review');
    const body = document.getElementById('admin-return-review-body');
    if (!modal || !body) return;

    modal.classList.add('active');
    body.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:#64748b;">
        <div style="font-size:28px; margin-bottom:8px;">⏳</div>
        <div>Mengambil data bukti pengembalian dari database...</div>
      </div>
    `;

    try {
      const res = await this.authFetch(`/orders/${orderId}/return`);
      const data = await res.json();
      const ret = (data && data.success && data.data) ? data.data : null;

      if (!ret) {
        body.innerHTML = `
          <div style="text-align:center; padding:30px 20px;">
            <div style="font-size:32px; margin-bottom:8px;">⚠️</div>
            <h4 style="color:#0f172a; margin-bottom:4px;">Belum Ada Pengajuan Retur</h4>
            <p style="color:#64748b; font-size:13px;">Pelanggan belum mengajukan retur untuk pesanan ini.</p>
          </div>
        `;
        return;
      }

      const photoList = Array.isArray(ret.photos) ? ret.photos : [];
      const dateFormatted = new Date(ret.createdAt || Date.now()).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      body.innerHTML = `
        <!-- Ringkasan Info Pelanggan & Pesanan -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px 18px; margin-bottom:20px; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; font-size:12.5px;">
          <div>No. Pesanan: <b style="color:#be123c;">${ret.orderId}</b></div>
          <div>Nama Pembeli: <b style="color:#0f172a;">${ret.userName || 'Pelanggan'}</b></div>
          <div>Waktu Pengajuan: <b style="color:#0f172a;">${dateFormatted} WIB</b></div>
          <div>Status Saat Ini: <b style="color:${ret.status === 'Disetujui' ? '#059669' : (ret.status === 'Ditolak' ? '#dc2626' : '#d97706')};">${ret.status}</b></div>
        </div>

        <!-- Alasan Pengembalian -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:13.5px; font-weight:800; color:#0f172a; margin:0 0 6px 0;">Alasan Pengembalian dari Pembeli:</h4>
          <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:12px 14px; font-size:13px; color:#1e293b; line-height:1.5;">
            ${ret.reason}
          </div>
        </div>

        <!-- Bukti Video Unboxing -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:13.5px; font-weight:800; color:#0f172a; margin:0 0 6px 0;">
            Bukti Video Unboxing & Pengetesan (Wajib 1 Video, Max 100MB):
          </h4>
          <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">🎥</span>
              <div>
                <div style="font-weight:700; font-size:13px; color:#0f172a;">${ret.video?.name || 'video_unboxing.mp4'}</div>
                <div style="font-size:11.5px; color:#64748b;">Ukuran: ${ret.video?.size ? (ret.video.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Terverifikasi'}</div>
              </div>
            </div>
            ${ret.video?.data ? `
              <a href="${ret.video.data}" download="${ret.video?.name || 'video.mp4'}" style="background:#ffffff; border:1px solid #cbd5e1; color:#0284c7; padding:4px 10px; border-radius:4px; font-size:11.5px; font-weight:700; text-decoration:none;">
                ⬇️ Unduh Video
              </a>
            ` : ''}
          </div>
          ${ret.video?.data ? `
            <div style="max-height:220px; overflow:hidden; border-radius:8px; border:1px solid #cbd5e1; background:#000;">
              <video src="${ret.video.data}" controls style="width:100%; max-height:220px;"></video>
            </div>
          ` : ''}
        </div>

        <!-- Bukti Foto (Min 2 Foto, Max 5 Foto) -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:13.5px; font-weight:800; color:#0f172a; margin:0 0 6px 0;">
            Bukti Foto Fisik & Segel Garansi (${photoList.length} Foto Diunggah):
          </h4>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            ${photoList.map((p, idx) => `
              <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; width:110px; height:110px; background:#f8fafc; cursor:pointer;" onclick="window.open('${p.data || p.url || p}', '_blank')">
                <img src="${p.data || p.url || p}" alt="Foto Bukti ${idx + 1}" style="width:100%; height:100%; object-fit:cover;" title="Klik untuk lihat resolusi penuh">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Form Keputusan Review Admin -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px 18px; margin-top:20px;">
          <label for="admin-review-notes" style="font-size:13px; font-weight:700; color:#0f172a; display:block; margin-bottom:6px;">
            Catatan / Alasan Admin untuk Pembeli:
          </label>
          <textarea id="admin-review-notes" rows="2" placeholder="Cth: Segel utuh & video valid, silakan kirimkan sparepart ke alamat kami. Atau: Ditolak karena segel robek..." style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:12.5px; box-sizing:border-box; margin-bottom:14px;">${ret.adminNotes || ''}</textarea>

          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <button type="button" class="btn-secondary" onclick="AdminApp.closeReturnReviewModal()">Tutup</button>
            
            <div style="display:flex; gap:10px;">
              <button type="button" onclick="AdminApp.submitReturnReview('${ret.id}', 'Ditolak')" style="background:#fee2e2; color:#be123c; border:1px solid #fecdd3; padding:8px 16px; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer;">
                ❌ Tolak Pengembalian
              </button>
              <button type="button" onclick="AdminApp.submitReturnReview('${ret.id}', 'Disetujui')" style="background:linear-gradient(135deg, #059669 0%, #047857 100%); color:#ffffff; border:none; padding:8px 18px; border-radius:8px; font-weight:800; font-size:12.5px; cursor:pointer; box-shadow:0 2px 8px rgba(5,150,105,0.3);">
                ✅ Setujui Pengembalian
              </button>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      body.innerHTML = `<div style="text-align:center; padding:30px; color:#dc2626;">Gagal memuat data pengembalian: ${err.message}</div>`;
    }
  },

  closeReturnReviewModal() {
    const modal = document.getElementById('admin-modal-return-review');
    if (modal) modal.classList.remove('active');
  },

  async submitReturnReview(returnId, status) {
    const notesInput = document.getElementById('admin-review-notes');
    const notes = notesInput ? notesInput.value.trim() : '';

    const confirmed = await this.confirmModal({
      title: `${status === 'Disetujui' ? 'Setujui' : 'Tolak'} Pengembalian Barang?`,
      message: `Apakah Anda yakin ingin memproses status pengembalian ini menjadi "${status}"?`,
      subtext: `Status akan disimpan di database Supabase dan diperbarui di akun pembeli.`,
      icon: status === 'Disetujui' ? '✅' : '❌',
      confirmText: `Ya, ${status}`,
      cancelText: 'Batal',
      isDanger: status === 'Ditolak'
    });

    if (!confirmed) return;

    try {
      const res = await this.authFetch(`/orders/returns/${returnId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNotes: notes })
      });
      const data = await res.json();
      if (data && data.success) {
        this.showToast(`🎉 Pengajuan pengembalian berhasil di-${status.toLowerCase()}!`);
        this.closeReturnReviewModal();
        await this.loadAllDashboardData();
      } else {
        alert((data && data.message) || 'Gagal memperbarui status review.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status review ke server.');
    }
  },

  /* =========================================================
     MANAJEMEN DATA AKUN PELANGGAN (168 PARTS USERS)
     ========================================================= */
  renderCustomersTable() {
    const tbody = document.getElementById('admin-customers-tbody');
    if (!tbody) return;

    const searchInput = document.getElementById('admin-cust-search');
    const filterSelect = document.getElementById('admin-cust-filter');
    const sortSelect = document.getElementById('admin-cust-sort');

    const query = (searchInput?.value || '').trim().toLowerCase();
    const filter = filterSelect?.value || 'all';
    const sort = sortSelect?.value || 'newest';

    let list = [...this.customers];

    // Filter Search
    if (query) {
      list = list.filter(c => {
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const address = (c.address || '').toLowerCase();
        const id = (c.id || '').toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query) || address.includes(query) || id.includes(query);
      });
    }

    // Filter Option
    if (filter === 'has_orders') {
      list = list.filter(c => Number(c.totalOrders || 0) > 0);
    } else if (filter === 'no_orders') {
      list = list.filter(c => Number(c.totalOrders || 0) === 0);
    } else if (filter === 'buyer') {
      list = list.filter(c => c.role !== 'admin');
    } else if (filter === 'admin') {
      list = list.filter(c => c.role === 'admin');
    }

    // Sorting
    if (sort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sort === 'spent_desc') {
      list.sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0));
    } else if (sort === 'orders_desc') {
      list.sort((a, b) => Number(b.totalOrders || 0) - Number(a.totalOrders || 0));
    } else if (sort === 'points_desc') {
      list.sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
    } else if (sort === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:40px 20px; color:#94a3b8;">
            <div style="font-size:32px; margin-bottom:8px;">👥</div>
            <div style="font-weight:700; color:#475569; font-size:14px;">Tidak ada akun pelanggan yang cocok dengan pencarian</div>
            <div style="font-size:12px; color:#94a3b8; margin-top:4px;">Coba gunakan kata kunci pencarian atau filter yang berbeda.</div>
          </td>
        </tr>
      `;
      return;
    }

    // Palette warna avatar inisial
    const avatarColors = ['#be123c', '#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777', '#475569'];

    tbody.innerHTML = list.map((c, index) => {
      const color = avatarColors[index % avatarColors.length];
      const initials = (c.name || 'User')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const isBuyer = c.role !== 'admin';
      const roleBadge = isBuyer
        ? `<span style="background:rgba(217,119,6,0.12); color:#b45309; border:1px solid rgba(217,119,6,0.3); font-size:10px; font-weight:800; padding:2px 7px; border-radius:12px; display:inline-flex; align-items:center; gap:3px;">⭐ MEMBER 168</span>`
        : `<span style="background:rgba(190,18,60,0.12); color:#be123c; border:1px solid rgba(190,18,60,0.3); font-size:10px; font-weight:800; padding:2px 7px; border-radius:12px; display:inline-flex; align-items:center; gap:3px;">🛡️ ADMIN</span>`;

      const pointsFormatted = Number(c.points || 0).toLocaleString('id-ID');
      const ordersCount = Number(c.totalOrders || 0);
      const spentFormatted = 'Rp' + Number(c.totalSpent || 0).toLocaleString('id-ID');

      const createdDate = c.createdAt
        ? new Date(c.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';

      const phoneDisplay = c.phone
        ? `<a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" style="color:#059669; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px;" title="Chat via WhatsApp">
            <span>💬</span> <span>${c.phone}</span>
          </a>`
        : `<span style="color:#94a3b8; font-style:italic;">Belum diatur</span>`;

      const addressDisplay = c.address
        ? `<div style="max-width:220px; font-size:12px; color:#475569; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.address}">📍 ${c.address}</div>`
        : `<span style="color:#94a3b8; font-size:12px; font-style:italic;">-</span>`;

      const orderBadge = ordersCount > 0
        ? `<span style="background:#ecfdf5; color:#047857; font-weight:800; padding:3px 9px; border-radius:12px; font-size:11.5px; border:1px solid #a7f3d0;">🛍️ ${ordersCount} Pesanan</span>`
        : `<span style="background:#f1f5f9; color:#64748b; font-weight:600; padding:3px 9px; border-radius:12px; font-size:11.5px;">Belum Belanja</span>`;

      return `
        <tr style="border-bottom:1px solid var(--admin-border); transition:background 0.15s ease;">
          <td style="padding:14px 16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:38px; height:38px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                ${initials}
              </div>
              <div style="display:flex; flex-direction:column; gap:3px;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-weight:800; color:#0f172a; font-size:13px;">${c.name}</span>
                  ${roleBadge}
                </div>
                <span style="font-size:11px; color:#64748b; font-family:monospace;">ID: ${c.id}</span>
              </div>
            </div>
          </td>
          <td style="padding:14px 16px;">
            <div style="display:flex; flex-direction:column; gap:3px; font-size:12px;">
              <span style="color:#1e293b; font-weight:600;">✉️ ${c.email}</span>
              ${phoneDisplay}
            </div>
          </td>
          <td style="padding:14px 16px;">
            ${addressDisplay}
          </td>
          <td style="padding:14px 16px;">
            <div style="display:inline-flex; align-items:center; gap:5px; background:#fffbeb; border:1px solid #fef3c7; color:#b45309; padding:4px 10px; border-radius:20px; font-weight:800; font-size:12px;">
              <span>🪙</span>
              <span>${pointsFormatted} Poin</span>
            </div>
          </td>
          <td style="padding:14px 16px;">
            ${orderBadge}
          </td>
          <td style="padding:14px 16px;">
            <span style="font-weight:800; color:#be123c; font-size:13px;">${spentFormatted}</span>
          </td>
          <td style="padding:14px 16px; font-size:12px; color:#64748b;">
            ${createdDate}
          </td>
          <td style="padding:14px 16px; text-align:right;">
            <button type="button" class="btn-secondary" style="padding:6px 12px; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:5px;" onclick="AdminApp.openCustomerDetailModal('${c.id}')">
              <span>🔍</span>
              <span>Detail Akun</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async openCustomerDetailModal(userId) {
    const modal = document.getElementById('admin-modal-customer-detail');
    const body = document.getElementById('admin-customer-detail-body');
    if (!modal || !body) return;

    modal.classList.add('active');
    body.innerHTML = `
      <div style="text-align:center; padding:40px 20px;">
        <div style="font-size:28px; margin-bottom:8px; animation:spin 1s linear infinite;">⏳</div>
        <div style="font-weight:700; color:#475569;">Memuat data lengkap profil & riwayat transaksi pelanggan...</div>
      </div>
    `;

    try {
      const res = await this.authFetch(`/auth/customers/${userId}`);
      const data = await res.json();
      if (!data || !data.success || !data.customer) {
        body.innerHTML = `<div style="text-align:center; padding:30px; color:#ef4444;">Gagal menemukan data pelanggan.</div>`;
        return;
      }

      const c = data.customer;
      const orders = c.orders || [];
      const initials = (c.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      const createdDate = c.createdAt
        ? new Date(c.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-';

      const avgSpent = c.totalOrders > 0
        ? 'Rp' + Math.round(Number(c.totalSpent || 0) / Number(c.totalOrders)).toLocaleString('id-ID')
        : 'Rp0';

      const hasCoords = c.coordinates && c.coordinates.lat && c.coordinates.lng;
      const mapsLink = hasCoords
        ? `<a href="https://www.google.com/maps?q=${c.coordinates.lat},${c.coordinates.lng}" target="_blank" rel="noopener noreferrer" style="color:#0284c7; font-weight:700; font-size:12px; text-decoration:none; display:inline-flex; align-items:center; gap:4px; margin-top:4px;">
            <span>🗺️</span> <span>Buka Koordinat GPS di Google Maps (${c.coordinates.lat.toFixed(5)}, ${c.coordinates.lng.toFixed(5)})</span>
          </a>`
        : '';

      const ordersListHtml = orders.length === 0
        ? `
          <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:24px; text-align:center; color:#94a3b8; font-size:13px;">
            🛒 Pelanggan belum pernah melakukan transaksi checkout.
          </div>
        `
        : `
          <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <table class="admin-table" style="font-size:12px; margin:0;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 12px;">ID Pesanan</th>
                  <th style="padding:10px 12px;">Tanggal Transaksi</th>
                  <th style="padding:10px 12px;">Rincian Barang</th>
                  <th style="padding:10px 12px; text-align:right;">Total Belanja</th>
                  <th style="padding:10px 12px; text-align:center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(ord => {
                  const ordDate = new Date(ord.createdAt || Date.now()).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  });
                  const itemsSummary = (ord.items || []).map(it => `<div>• ${it.name} <b>(x${it.quantity || 1})</b></div>`).join('');
                  
                  let statusBadge = `<span style="background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:700;">${ord.status}</span>`;
                  if (ord.status === 'Sedang Diproses') {
                    statusBadge = `<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:700;">⏳ Diproses</span>`;
                  } else if (ord.status.includes('Dikirim')) {
                    statusBadge = `<span style="background:#e0f2fe; color:#0284c7; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:700;">🚚 Dikirim</span>`;
                  } else if (ord.status === 'Sampai di Tujuan' || ord.status === 'Selesai') {
                    statusBadge = `<span style="background:#ecfdf5; color:#047857; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:700;">✅ Selesai</span>`;
                  } else if (ord.returnStatus && ord.returnStatus !== 'none') {
                    statusBadge = `<span style="background:#fff1f2; color:#be123c; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:700;">🔄 Retur: ${ord.returnStatus}</span>`;
                  }

                  return `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:10px 12px; font-weight:700; color:#0f172a;">
                        ${ord.id}
                        <div style="font-size:11px; color:#64748b; font-weight:normal;">${ord.paymentMethod || 'Transfer'}</div>
                      </td>
                      <td style="padding:10px 12px; color:#475569;">${ordDate}</td>
                      <td style="padding:10px 12px; max-width:240px;">${itemsSummary || '-'}</td>
                      <td style="padding:10px 12px; text-align:right; font-weight:800; color:#be123c;">
                        Rp${Number(ord.totalAmount || 0).toLocaleString('id-ID')}
                      </td>
                      <td style="padding:10px 12px; text-align:center;">
                        ${statusBadge}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;

      body.innerHTML = `
        <!-- Profile Banner Card -->
        <div style="background:linear-gradient(135deg, #be123c 0%, #881337 100%); border-radius:12px; padding:20px; color:#fff; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:20px; box-shadow:0 4px 14px rgba(190,18,60,0.25);">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="width:58px; height:58px; border-radius:50%; background:#fff; color:#be123c; font-size:22px; font-weight:900; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
              ${initials}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h3 style="margin:0; font-size:18px; font-weight:800; color:#fff;">${c.name}</h3>
                <span style="background:rgba(255,255,255,0.2); font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px; color:#fff;">
                  ${c.role === 'admin' ? '🛡️ Administrator' : '⭐ Member Pelanggan'}
                </span>
              </div>
              <div style="font-size:12.5px; color:#fecdd3; margin-top:3px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <span>✉️ ${c.email}</span>
                <span>📞 ${c.phone || '-'}</span>
                <span>📅 Terdaftar sejak: ${createdDate}</span>
              </div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:10px; padding:10px 16px; text-align:center; min-width:130px;">
            <div style="font-size:11px; color:#ffe4e6; font-weight:700; text-transform:uppercase;">Saldo 168 Points</div>
            <div style="font-size:22px; font-weight:900; color:#fff; display:flex; align-items:center; justify-content:center; gap:6px; margin-top:2px;">
              <span>🪙</span>
              <span>${Number(c.points || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <!-- 3 Quick Metrics Cards -->
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; margin-bottom:20px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#64748b;">Total Pesanan</div>
            <div style="font-size:20px; font-weight:900; color:#0f172a; margin-top:4px;">🛍️ ${c.totalOrders} Transaksi</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#64748b;">Akumulasi Belanja</div>
            <div style="font-size:20px; font-weight:900; color:#be123c; margin-top:4px;">Rp${Number(c.totalSpent || 0).toLocaleString('id-ID')}</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#64748b;">Rata-rata per Pesanan</div>
            <div style="font-size:20px; font-weight:900; color:#0284c7; margin-top:4px;">${avgSpent}</div>
          </div>
        </div>

        <!-- Alamat & Pengiriman -->
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:20px;">
          <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <span>📍</span> <span>Alamat Pengiriman Terdaftar</span>
          </div>
          <p style="font-size:13px; color:#475569; line-height:1.5; margin:0;">
            ${c.address || '<span style="color:#94a3b8; font-style:italic;">Pelanggan belum mengisi alamat pengiriman tetap.</span>'}
          </p>
          ${mapsLink}
        </div>

        <!-- Riwayat Transaksi Pesanan -->
        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
            <div style="font-size:13.5px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:6px;">
              <span>📑</span> <span>Riwayat Pesanan Pelanggan (${orders.length})</span>
            </div>
          </div>
          ${ordersListHtml}
        </div>
      `;
    } catch (err) {
      console.error(err);
      body.innerHTML = `<div style="text-align:center; padding:30px; color:#ef4444;">Terjadi kesalahan saat memuat data pelanggan.</div>`;
    }
  },

  closeCustomerDetailModal() {
    const modal = document.getElementById('admin-modal-customer-detail');
    if (modal) modal.classList.remove('active');
  },

  exportCustomersCSV() {
    if (!this.customers || this.customers.length === 0) {
      alert('Tidak ada data akun pelanggan untuk diekspor.');
      return;
    }

    const headers = [
      'ID Akun',
      'Nama Lengkap',
      'Role / Tipe',
      'Email',
      'Nomor WhatsApp / HP',
      'Alamat Pengiriman',
      'Saldo 168 Points',
      'Total Pesanan',
      'Total Belanja (Rp)',
      'Tanggal Registrasi',
      'Pesanan Terakhir'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = this.customers.map(c => {
      const regDate = c.createdAt
        ? new Date(c.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '-';
      const lastOrder = c.lastOrderDate
        ? new Date(c.lastOrderDate).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '-';

      return [
        escapeCsv(c.id),
        escapeCsv(c.name),
        escapeCsv(c.role === 'admin' ? 'Admin' : 'Member Buyer'),
        escapeCsv(c.email),
        escapeCsv(c.phone || '-'),
        escapeCsv(c.address || '-'),
        escapeCsv(Number(c.points || 0)),
        escapeCsv(Number(c.totalOrders || 0)),
        escapeCsv(Number(c.totalSpent || 0)),
        escapeCsv(regDate),
        escapeCsv(lastOrder)
      ].join(',');
    });

    // Ringkasan Total
    const totalPoints = this.customers.reduce((acc, c) => acc + (Number(c.points) || 0), 0);
    const totalSpent = this.customers.reduce((acc, c) => acc + (Number(c.totalSpent) || 0), 0);
    const summaryRow = [
      escapeCsv('TOTAL KESELURUHAN'),
      escapeCsv(`${this.customers.length} Akun`),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(totalPoints),
      escapeCsv(''),
      escapeCsv(totalSpent),
      escapeCsv(''),
      escapeCsv('')
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Pelanggan_168Parts_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(`👥 Berhasil mengekspor ${this.customers.length} data akun pelanggan ke file Excel (CSV)!`);
  },

  renderPromosTable() {
    const tbody = document.getElementById('admin-promos-tbody');
    if (!tbody) return;

    const q = (document.getElementById('admin-promo-search')?.value || '').toLowerCase();
    const cat = document.getElementById('admin-promo-cat-filter')?.value || 'Semua';

    let list = this.promos.filter(p => {
      const matchQ = (p.code && p.code.toLowerCase().includes(q)) || 
                     (p.title && p.title.toLowerCase().includes(q)) ||
                     (p.description && p.description.toLowerCase().includes(q));
      const matchCat = cat === 'Semua' || (p.category && p.category.toLowerCase() === cat.toLowerCase());
      return matchQ && matchCat;
    });

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">Tidak ada voucher promo yang cocok dengan pencarian</td></tr>`;
      return;
    }

    const catLabels = {
      diskon: { text: 'Diskon Belanja', cls: 'badge-promo-diskon' },
      ongkir: { text: 'Gratis Ongkir', cls: 'badge-promo-ongkir' },
      cashback: { text: 'Cashback Koin', cls: 'badge-promo-cashback' },
      lokal: { text: 'Brand Lokal', cls: 'badge-promo-lokal' }
    };

    tbody.innerHTML = list.map(p => {
      const catInfo = catLabels[p.category] || { text: p.category || 'Diskon', cls: 'badge-promo-diskon' };
      const valDisplay = p.discountType === 'percent'
        ? `<b style="color:#dc2626; font-size:14px;">${p.discountValue}% OFF</b>${p.maxDiscount ? `<br><small style="color:#64748b;">Maks. Rp${p.maxDiscount.toLocaleString('id-ID')}</small>` : ''}`
        : `<b style="color:#059669; font-size:14px;">Rp${p.discountValue.toLocaleString('id-ID')}</b>`;

      const minSpendText = p.minSpend > 0 ? `Rp${p.minSpend.toLocaleString('id-ID')}` : '<span style="color:#64748b;">Tanpa Min.</span>';
      const quotaPct = Math.min(100, Math.round(((p.usedCount || 0) / (p.quota || 1)) * 100));

      return `
        <tr>
          <td>
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span style="font-weight:800; color:#1d3f0d; font-family:monospace; font-size:13.5px; letter-spacing:0.5px;">${p.code}</span>
              <span style="font-size:10px; color:#64748b;">VOUCHER TOKO</span>
            </div>
          </td>
          <td>
            <b>${p.title}</b>
            <div style="font-size:11.5px; color:#64748b; line-height:1.3; max-width:240px;">${p.description || '-'}</div>
          </td>
          <td>
            <span class="badge-status ${catInfo.cls}" style="font-size:11px; font-weight:700;">${catInfo.text}</span>
          </td>
          <td>${valDisplay}</td>
          <td>${minSpendText}</td>
          <td>
            <div class="promo-quota-wrap">
              <span style="font-size:11.5px; font-weight:700;">${p.usedCount || 0} / ${p.quota || 0}</span>
              <div class="promo-quota-bar">
                <div class="promo-quota-fill" style="width: ${quotaPct}%;"></div>
              </div>
            </div>
          </td>
          <td>
            <label class="toggle-switch">
              <input type="checkbox" ${p.isActive ? 'checked' : ''} onchange="AdminApp.togglePromoStatus('${p.code}', this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </td>
          <td>
            <div class="action-btns">
              <button class="btn-action-icon" title="Edit Promo" onclick="AdminApp.openEditPromoModal('${p.code}')">✏️</button>
              <button class="btn-action-icon btn-delete" title="Hapus Promo" onclick="AdminApp.deletePromo('${p.code}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async togglePromoStatus(code, isActive) {
    const p = this.promos.find(x => x.code === code);
    if (!p) return;
    p.isActive = isActive;

    try {
      const res = await this.authFetch(`/promos/${code}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`Status voucher ${code} diubah: ${isActive ? 'Aktif' : 'Nonaktif'}`);
        this.updateStats();
      } else {
        alert(data.message || 'Gagal mengubah status promo.');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal mengubah status promo di server.');
    }
  },

  onPromoTypeChange(type) {
    const lblVal = document.getElementById('lbl-promo-value');
    const groupMax = document.getElementById('group-promo-max-discount');
    const inputVal = document.getElementById('f-promo-value');
    if (type === 'percent') {
      if (lblVal) lblVal.textContent = 'Nilai Diskon (%) *';
      if (inputVal) { inputVal.placeholder = '20'; inputVal.max = '100'; }
      if (groupMax) groupMax.style.display = 'block';
    } else {
      if (lblVal) lblVal.textContent = 'Nilai Potongan (Rp) *';
      if (inputVal) { inputVal.placeholder = '25000'; inputVal.removeAttribute('max'); }
      if (groupMax) groupMax.style.display = 'none';
    }
  },

  openAddPromoModal() {
    this.activeEditingPromoCode = null;
    document.getElementById('modal-promo-title').textContent = 'Buat Voucher Promo Baru';
    document.getElementById('form-promo').reset();
    document.getElementById('f-promo-code').disabled = false;
    this.onPromoTypeChange('percent');
    document.getElementById('admin-modal-promo').classList.add('active');
  },

  openEditPromoModal(code) {
    const p = this.promos.find(x => x.code === code);
    if (!p) return;

    this.activeEditingPromoCode = code;
    document.getElementById('modal-promo-title').textContent = 'Edit Pengaturan Voucher Promo';
    
    const codeInput = document.getElementById('f-promo-code');
    codeInput.value = p.code;
    codeInput.disabled = true;

    document.getElementById('f-promo-title').value = p.title || '';
    document.getElementById('f-promo-category').value = p.category || 'diskon';
    document.getElementById('f-promo-type').value = p.discountType || 'percent';
    this.onPromoTypeChange(p.discountType || 'percent');
    document.getElementById('f-promo-value').value = p.discountValue || '';
    document.getElementById('f-promo-min-spend').value = p.minSpend || 0;
    document.getElementById('f-promo-max-discount').value = p.maxDiscount || '';
    document.getElementById('f-promo-quota').value = p.quota || 100;
    document.getElementById('f-promo-desc').value = p.description || '';
    document.getElementById('f-promo-active').checked = !!p.isActive;

    document.getElementById('admin-modal-promo').classList.add('active');
  },

  closePromoModal() {
    document.getElementById('admin-modal-promo').classList.remove('active');
  },

  async handleSavePromo(event) {
    event.preventDefault();
    const code = document.getElementById('f-promo-code').value.trim().toUpperCase();
    const title = document.getElementById('f-promo-title').value.trim();
    const category = document.getElementById('f-promo-category').value;
    const discount_type = document.getElementById('f-promo-type').value;
    const discount_value = Number(document.getElementById('f-promo-value').value);
    const min_spend = Number(document.getElementById('f-promo-min-spend').value) || 0;
    const max_discount = Number(document.getElementById('f-promo-max-discount').value) || null;
    const quota = Number(document.getElementById('f-promo-quota').value) || 100;
    const description = document.getElementById('f-promo-desc').value.trim();
    const is_active = document.getElementById('f-promo-active').checked;

    const payload = {
      code,
      title,
      category,
      discount_type,
      discount_value,
      min_spend,
      max_discount,
      quota,
      description,
      is_active
    };

    try {
      if (this.activeEditingPromoCode) {
        // UPDATE (PUT)
        const res = await this.authFetch(`/promos/${this.activeEditingPromoCode}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          const idx = this.promos.findIndex(x => x.code === this.activeEditingPromoCode);
          if (idx !== -1) this.promos[idx] = data.data;
          this.showToast(`✅ Voucher ${code} berhasil diperbarui!`);
        } else {
          alert(data.message || 'Gagal memperbarui voucher.');
          return;
        }
      } else {
        // CREATE (POST)
        const res = await this.authFetch('/promos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.data) {
          this.promos.unshift(data.data);
          this.showToast(`🎉 Voucher baru "${code}" berhasil diterbitkan!`);
        } else {
          alert(data.message || 'Gagal membuat voucher baru.');
          return;
        }
      }

      this.closePromoModal();
      this.updateStats();
      this.renderPromosTable();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan voucher ke server.');
    }
  },

  async deletePromo(code) {
    const confirmed = await this.confirmModal({
      title: 'Hapus Voucher Promo?',
      message: `Hapus voucher "${code}" dari sistem?`,
      subtext: 'Pelanggan tidak akan dapat lagi menggunakan voucher ini saat checkout belanja.',
      icon: '🎟️',
      confirmText: 'Ya, Hapus Voucher',
      cancelText: 'Batal',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      const res = await this.authFetch(`/promos/${code}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        this.promos = this.promos.filter(x => x.code !== code);
        this.showToast(`🗑️ Voucher "${code}" berhasil dihapus.`);
        this.updateStats();
        this.renderPromosTable();
      } else {
        alert(data.message || 'Gagal menghapus voucher.');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus voucher.');
    }
  },

  async fetchBanners() {
    try {
      const res = await this.authFetch('/banners');
      const data = await res.json();
      if (data && data.success && data.data) {
        this.banners = data.data;
      }
    } catch (e) {
      console.warn('Gagal fetch /api/banners', e);
    }
  },

  populateBannerProductSelects() {
    const leftSelect = document.getElementById('cfg-b-left-prod-select');
    const rightSelect = document.getElementById('cfg-b-right-prod-select');
    if (!this.products || this.products.length === 0) return;

    const optionsHtml = '<option value="">-- Pilih Produk untuk Ditautkan Otomatis --</option>' +
      this.products.map(p => `
        <option value="${p.id}">[${p.category || 'Sparepart'}] ${p.name} (Rp${Number(p.price || 0).toLocaleString('id-ID')})</option>
      `).join('');

    if (leftSelect) leftSelect.innerHTML = optionsHtml;
    if (rightSelect) rightSelect.innerHTML = optionsHtml;
  },

  applyBannerPreset(side, url) {
    const inputEl = document.getElementById(`cfg-b-${side}-url`);
    if (inputEl) {
      inputEl.value = url;
      this.updateBannerPreview();
      this.showToast(`✓ Preset link ${side === 'left' ? 'Banner Kiri' : 'Banner Kanan'} diterapkan!`);
    }
  },

  selectBannerProduct(side, productId) {
    if (!productId) return;
    const prod = this.products.find(p => p.id === productId);
    const inputEl = document.getElementById(`cfg-b-${side}-url`);
    if (inputEl) {
      inputEl.value = `#/product/${productId}`;
    }

    // Optional quick banner auto-fill hint
    if (prod && side === 'left') {
      const titleInput = document.getElementById('cfg-b-left-title');
      const badgeInput = document.getElementById('cfg-b-left-badge');
      if (confirm(`Apakah Anda juga ingin memperbarui Judul & Badge Banner Kiri dengan produk "${prod.name}"?`)) {
        if (titleInput) titleInput.value = prod.name;
        if (badgeInput) badgeInput.value = '🔥 PRODUK TERBARU 168 PARTS';
        if (prod.image) {
          const imgInput = document.getElementById('cfg-b-left-img');
          if (imgInput) imgInput.value = prod.image;
        }
      }
    } else if (prod && side === 'right') {
      const titleInput = document.getElementById('cfg-b-right-title');
      if (confirm(`Apakah Anda ingin memperbarui Judul Banner Kanan dengan produk "${prod.name}"?`)) {
        if (titleInput) titleInput.value = prod.name;
        if (prod.image) {
          const img1Input = document.getElementById('cfg-b-right-img1');
          if (img1Input) img1Input.value = prod.image;
        }
      }
    }

    this.updateBannerPreview();
  },

  populateBannerForm() {
    if (!this.banners) return;
    const { left, right } = this.banners;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

    if (left) {
      setVal('cfg-b-left-badge', left.badge || '✨ 168 PARTS SURABAYA');
      setVal('cfg-b-left-title', left.title || 'Pusat Sparepart & Alat Servis HP Terlengkap');
      setVal('cfg-b-left-p1', left.pills ? left.pills[0] : '🏷️ LCD & Baterai Bergaransi');
      setVal('cfg-b-left-p2', left.pills ? left.pills[1] : '⚡ Promo Pengguna Baru: Diskon 50RB');
      setVal('cfg-b-left-p3', left.pills ? left.pills[2] : '⭐ Sparepart Presisi Siap Kirim');
      setVal('cfg-b-left-img', left.modelImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=320');
      setVal('cfg-b-left-color', left.bgGradient || 'linear-gradient(135deg, #881337 0%, #be123c 100%)');
      setVal('cfg-b-left-url', left.targetUrl || 'login.html?promo=newuser#register');
    }

    if (right) {
      setVal('cfg-b-right-title', right.title || 'Flash Sale & Promo Spesial Teknisi');
      setVal('cfg-b-right-p1-title', right.pill1Title || 'DISKON S.D.');
      setVal('cfg-b-right-p1-val', right.pill1Val || '50%');
      setVal('cfg-b-right-p2-title', right.pill2Title || 'VOUCHER');
      setVal('cfg-b-right-p2-val', right.pill2Val || '100RB');
      setVal('cfg-b-right-img1', right.modelImage1 || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=240');
      setVal('cfg-b-right-img2', right.modelImage2 || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=240');
      setVal('cfg-b-right-color', right.bgGradient || 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #be123c 100%)');
      setVal('cfg-b-right-url', right.targetUrl || '#promo');
    }

    this.updateBannerPreview();
  },

  updateBannerPreview() {
    // Left preview elements
    const badgeVal = document.getElementById('cfg-b-left-badge')?.value || '✨ 168 PARTS SURABAYA';
    const titleVal = document.getElementById('cfg-b-left-title')?.value || 'Pusat Sparepart & Alat Servis HP Terlengkap';
    const p1Val = document.getElementById('cfg-b-left-p1')?.value || '🏷️ LCD & Baterai Bergaransi';
    const p2Val = document.getElementById('cfg-b-left-p2')?.value || '⚡ Promo Pengguna Baru: Diskon 50RB';
    const p3Val = document.getElementById('cfg-b-left-p3')?.value || '⭐ Sparepart Presisi Siap Kirim';
    const imgVal = document.getElementById('cfg-b-left-img')?.value || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=320';
    const colorVal = document.getElementById('cfg-b-left-color')?.value || 'linear-gradient(135deg, #881337 0%, #be123c 100%)';
    const leftUrlVal = document.getElementById('cfg-b-left-url')?.value || 'login.html?promo=newuser#register';

    const prevLeftBox = document.getElementById('prev-left-box');
    const prevLeftBadge = document.getElementById('prev-left-badge');
    const prevLeftTitle = document.getElementById('prev-left-title');
    const prevLeftP1 = document.getElementById('prev-left-p1');
    const prevLeftP2 = document.getElementById('prev-left-p2');
    const prevLeftP3 = document.getElementById('prev-left-p3');
    const prevLeftImg = document.getElementById('prev-left-img');
    const prevLeftUrlLabel = document.getElementById('prev-left-url-label');

    if (prevLeftBox) prevLeftBox.style.background = colorVal;
    if (prevLeftBadge) prevLeftBadge.textContent = badgeVal;
    if (prevLeftTitle) prevLeftTitle.textContent = titleVal;
    if (prevLeftP1) prevLeftP1.textContent = p1Val;
    if (prevLeftP2) prevLeftP2.textContent = p2Val;
    if (prevLeftP3) prevLeftP3.textContent = p3Val;
    if (prevLeftImg) prevLeftImg.src = imgVal;
    if (prevLeftUrlLabel) prevLeftUrlLabel.textContent = leftUrlVal || '(Tidak ada tautan)';

    // Right preview elements
    const rTitle = document.getElementById('cfg-b-right-title')?.value || 'Flash Sale & Promo Spesial';
    const rp1Title = document.getElementById('cfg-b-right-p1-title')?.value || 'DISKON S.D.';
    const rp1Val = document.getElementById('cfg-b-right-p1-val')?.value || '50%';
    const rp2Title = document.getElementById('cfg-b-right-p2-title')?.value || 'VOUCHER';
    const rp2Val = document.getElementById('cfg-b-right-p2-val')?.value || '100RB';
    const rImg1 = document.getElementById('cfg-b-right-img1')?.value || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=240';
    const rImg2 = document.getElementById('cfg-b-right-img2')?.value || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=240';
    const rColor = document.getElementById('cfg-b-right-color')?.value || 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #be123c 100%)';
    const rightUrlVal = document.getElementById('cfg-b-right-url')?.value || '#promo';

    const prevRightBox = document.getElementById('prev-right-box');
    const prevRightTitle = document.getElementById('prev-right-title');
    const prevRightP1Title = document.getElementById('prev-right-p1-title');
    const prevRightP1Val = document.getElementById('prev-right-p1-val');
    const prevRightP2Title = document.getElementById('prev-right-p2-title');
    const prevRightP2Val = document.getElementById('prev-right-p2-val');
    const prevRightImg1 = document.getElementById('prev-right-img1');
    const prevRightImg2 = document.getElementById('prev-right-img2');
    const prevRightUrlLabel = document.getElementById('prev-right-url-label');

    if (prevRightBox) prevRightBox.style.background = rColor;
    if (prevRightTitle) prevRightTitle.textContent = rTitle;
    if (prevRightP1Title) prevRightP1Title.textContent = rp1Title;
    if (prevRightP1Val) prevRightP1Val.textContent = rp1Val;
    if (prevRightP2Title) prevRightP2Title.textContent = rp2Title;
    if (prevRightP2Val) prevRightP2Val.textContent = rp2Val;
    if (prevRightImg1) prevRightImg1.src = rImg1;
    if (prevRightImg2) prevRightImg2.src = rImg2;
    if (prevRightUrlLabel) prevRightUrlLabel.textContent = rightUrlVal || '(Tidak ada tautan)';
  },

  onBannerLeftColorChange(color) {
    const prevLeftBox = document.getElementById('prev-left-box');
    if (prevLeftBox) prevLeftBox.style.background = color;
  },

  onBannerRightColorChange(color) {
    const prevRightBox = document.getElementById('prev-right-box');
    if (prevRightBox) prevRightBox.style.background = color;
  },

  async saveBanners() {
    const payload = {
      left: {
        badge: document.getElementById('cfg-b-left-badge')?.value || '✨ 168 PARTS SURABAYA',
        title: document.getElementById('cfg-b-left-title')?.value || 'Pusat Sparepart & Alat Servis HP Terlengkap',
        pills: [
          document.getElementById('cfg-b-left-p1')?.value || '🏷️ LCD & Baterai Bergaransi',
          document.getElementById('cfg-b-left-p2')?.value || '⚡ Promo Pengguna Baru: Diskon 50RB',
          document.getElementById('cfg-b-left-p3')?.value || '⭐ Sparepart Presisi Siap Kirim'
        ],
        modelImage: document.getElementById('cfg-b-left-img')?.value || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=320',
        bgGradient: document.getElementById('cfg-b-left-color')?.value || 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
        targetUrl: document.getElementById('cfg-b-left-url')?.value.trim() || 'login.html?promo=newuser#register'
      },
      right: {
        title: document.getElementById('cfg-b-right-title')?.value || 'Flash Sale & Promo Spesial Teknisi',
        pill1Title: document.getElementById('cfg-b-right-p1-title')?.value || 'DISKON S.D.',
        pill1Val: document.getElementById('cfg-b-right-p1-val')?.value || '50%',
        pill2Title: document.getElementById('cfg-b-right-p2-title')?.value || 'VOUCHER',
        pill2Val: document.getElementById('cfg-b-right-p2-val')?.value || '100RB',
        modelImage1: document.getElementById('cfg-b-right-img1')?.value || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=240',
        modelImage2: document.getElementById('cfg-b-right-img2')?.value || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=240',
        bgGradient: document.getElementById('cfg-b-right-color')?.value || 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #be123c 100%)',
        targetUrl: document.getElementById('cfg-b-right-url')?.value.trim() || '#promo'
      }
    };

    try {
      const res = await this.authFetch('/banners', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        this.banners = data.data;
        this.showToast('✅ Pengaturan banner beranda berhasil disimpan di database!');
      } else {
        alert(data.message || 'Gagal menyimpan perubahan banner.');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menghubungi server untuk menyimpan banner.');
    }
  },

  async resetBanners() {
    const confirmed = await this.confirmModal({
      title: 'Reset Desain Banner?',
      message: 'Kembalikan semua banner ke desain awal bawaan 168 Parts?',
      subtext: 'Desain banner utama beranda akan direset ke pengaturan standar resmi toko.',
      icon: '🔄',
      confirmText: 'Ya, Reset Banner',
      cancelText: 'Batal',
      isDanger: false
    });
    if (!confirmed) return;

    try {
      const res = await this.authFetch('/banners/reset', { method: 'POST' });
      const data = await res.json();
      if (data && data.success) {
        this.banners = data.data;
        this.populateBannerForm();
        this.showToast('🔄 Desain banner berhasil direset ke pengaturan default!');
      } else {
        alert(data.message || 'Gagal mereset banner.');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal mereset banner.');
    }
  },

  async checkDbHealth(showToast = false) {
    const pill = document.getElementById('admin-db-status-pill');
    const dot = document.getElementById('admin-db-status-dot');
    const text = document.getElementById('admin-db-status-text');

    if (pill) {
      pill.classList.remove('status-pill-connected', 'status-pill-disconnected');
      pill.classList.add('status-pill-checking');
    }
    if (text) text.textContent = 'Memeriksa DB...';

    const getBaseUrl = () => {
      if (window.PasarinAPI && window.PasarinAPI.baseUrl) {
        return window.PasarinAPI.baseUrl;
      }
      return '/api';
    };

    let isConnected = false;
    let latency = 0;
    let errMessage = '';

    try {
      let apiBase = getBaseUrl();
      let res;
      try {
        res = await fetch(`${apiBase}/health`, { cache: 'no-cache' });
      } catch (netErr) {
        const cloudBase = (window.PasarinAPI && window.PasarinAPI.cloudBaseUrl) || 'https://partonesixeight.vercel.app/api';
        if (apiBase !== cloudBase) {
          if (window.PasarinAPI) window.PasarinAPI.baseUrl = cloudBase;
          res = await fetch(`${cloudBase}/health`, { cache: 'no-cache' });
        } else {
          throw netErr;
        }
      }

      if (res) {
        const data = await res.json();
        if (data && data.database && data.database.connected) {
          isConnected = true;
          latency = data.database.latencyMs || 0;
        } else {
          errMessage = (data && data.database && data.database.message) || 'Status database offline';
        }
      }
    } catch (err) {
      isConnected = false;
      errMessage = err.message || 'Gagal tersambung ke server / database';
    }

    if (isConnected) {
      if (pill) {
        pill.classList.remove('status-pill-checking', 'status-pill-disconnected');
        pill.classList.add('status-pill-connected');
        pill.title = `Database Supabase Cloud Terkoneksi Aktif (${latency}ms). Klik untuk periksa ulang.`;
      }
      if (text) {
        text.textContent = 'Database Terhubung (Supabase)';
      }
      if (showToast) {
        this.showToast(`🟢 Database Supabase Cloud terhubung aktif (${latency}ms)!`);
      }
    } else {
      if (pill) {
        pill.classList.remove('status-pill-checking', 'status-pill-connected');
        pill.classList.add('status-pill-disconnected');
        pill.title = `Database Terputus (Offline): ${errMessage}. Klik untuk coba tes ulang.`;
      }
      if (text) {
        text.textContent = 'Database Terputus (Offline)';
      }
      if (showToast) {
        this.showToast(`🔴 Database terputus / offline: ${errMessage}`, true);
      }
    }
  },

  confirmModal({
    title = 'Konfirmasi Tindakan',
    message = 'Apakah Anda yakin?',
    subtext = '',
    icon = '⚠️',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    isDanger = true
  } = {}) {
    return new Promise((resolve) => {
      const modal = document.getElementById('admin-confirm-modal');
      const iconWrap = document.getElementById('confirm-modal-icon-wrap');
      const iconEl = document.getElementById('confirm-modal-icon');
      const titleEl = document.getElementById('confirm-modal-title');
      const msgEl = document.getElementById('confirm-modal-message');
      const subEl = document.getElementById('confirm-modal-subtext');
      const btnCancel = document.getElementById('confirm-modal-btn-cancel');
      const btnOk = document.getElementById('confirm-modal-btn-ok');

      if (!modal) {
        // Fallback jika elemen modal belum ada di DOM
        resolve(window.confirm(`${title}\n${message}`));
        return;
      }

      if (iconEl) iconEl.textContent = icon;
      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      if (subEl) {
        subEl.textContent = subtext;
        subEl.style.display = subtext ? 'block' : 'none';
      }
      if (btnCancel) btnCancel.textContent = cancelText;
      if (btnOk) {
        btnOk.textContent = confirmText;
        if (isDanger) {
          btnOk.classList.remove('is-primary');
          if (iconWrap) {
            iconWrap.classList.remove('is-primary');
            iconWrap.classList.add('is-danger');
          }
        } else {
          btnOk.classList.add('is-primary');
          if (iconWrap) {
            iconWrap.classList.remove('is-danger');
            iconWrap.classList.add('is-primary');
          }
        }
      }

      const cleanup = () => {
        modal.classList.remove('active');
        document.removeEventListener('keydown', onKeyDown);
        if (btnOk) btnOk.onclick = null;
        if (btnCancel) btnCancel.onclick = null;
        modal.onclick = null;
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
        } else if (e.key === 'Enter') {
          cleanup();
          resolve(true);
        }
      };

      if (btnOk) {
        btnOk.onclick = () => {
          cleanup();
          resolve(true);
        };
      }

      if (btnCancel) {
        btnCancel.onclick = () => {
          cleanup();
          resolve(false);
        };
      }

      modal.onclick = (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(false);
        }
      };

      document.addEventListener('keydown', onKeyDown);
      modal.classList.add('active');
      if (btnOk) btnOk.focus();
    });
  },

  showToast(message, isError = false) {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      document.body.appendChild(toast);
    }
    toast.style.cssText = `
      position: fixed; top: 20px; right: 24px; z-index: 99999;
      background: ${isError ? '#be123c' : '#047857'}; color: #ffffff; padding: 12px 20px;
      border-radius: 8px; font-weight: 700; font-size: 13.5px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25); transition: all 0.3s ease;
    `;
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.style.display = 'none', 300);
    }, 2800);
  }
};

// Auto init
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
