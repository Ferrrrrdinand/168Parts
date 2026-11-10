/* =========================================================
   168 Parts Surabaya - Admin Dashboard Controller
   Live CRUD, Realtime Analytics, Order & Stock Management
   ========================================================= */

const AdminApp = {
  products: [],
  orders: [],
  promos: [],
  banners: null,
  currentTab: 'overview',
  activeEditingId: null,
  activeEditingPromoCode: null,
  currentUser: null,

  async init() {
    this.bindEvents();

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

  handleAdminLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari sesi Administrator?')) {
      if (window.PasarinAPI) window.PasarinAPI.setToken(null);
      localStorage.removeItem('pasarin_token');
      localStorage.removeItem('pasarin_user');
      this.currentUser = null;
      this.showAuthGate();
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
    await this.fetchPromos();
    await this.fetchBanners();
    this.updateStats();
    this.renderProductsTable();
    this.renderOrdersTable();
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

    // Badge di sidebar
    const prodBadge = document.getElementById('badge-prod-count');
    const orderBadge = document.getElementById('badge-order-count');
    const promoBadge = document.getElementById('badge-promo-count');
    if (prodBadge) prodBadge.textContent = this.products.length;
    if (orderBadge) orderBadge.textContent = this.orders.length;
    if (promoBadge) promoBadge.textContent = this.promos.length;
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
              <img src="${(p.image && !p.image.includes('unsplash.com')) ? p.image : 'images/product-placeholder.svg'}" alt="${p.name}" class="prod-thumb" onerror="this.src='images/product-placeholder.svg'">
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
    if (filterStatus !== 'Semua') {
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

      return `
        <tr>
          <td><span style="font-weight:700; color:#1d3f0d;">${o.id}</span><br><small style="color:#94a3b8;">${dateFormatted}</small></td>
          <td><b>${o.customerName || 'Pelanggan 168 Parts'}</b></td>
          <td style="font-size:12px; line-height:1.4;">${itemsText}</td>
          <td><b>Rp${Number(o.totalAmount || 0).toLocaleString('id-ID')}</b></td>
          <td><span style="color:#059669; font-weight:800;">+${o.earnedPoints || Math.floor((o.totalAmount||0)/1000)} Pts</span></td>
          <td>
            <select class="admin-select" style="font-size:11.5px; padding:4px 8px;" onchange="AdminApp.updateOrderStatus('${o.id}', this.value)">
              <option value="Sedang Diproses" ${o.status === 'Sedang Diproses' ? 'selected' : ''}>⏳ Diproses</option>
              <option value="Sedang Dikirim" ${o.status === 'Sedang Dikirim' ? 'selected' : ''}>🚚 Dikirim</option>
              <option value="Selesai" ${o.status === 'Selesai' ? 'selected' : ''}>✅ Selesai</option>
              <option value="Dibatalkan" ${o.status === 'Dibatalkan' ? 'selected' : ''}>❌ Dibatalkan</option>
            </select>
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

  openAddModal() {
    this.activeEditingId = null;
    document.getElementById('modal-product-title').textContent = 'Tambah Produk Baru';
    document.getElementById('form-product').reset();
    document.getElementById('prod-img-preview').src = 'images/product-placeholder.svg';
    document.getElementById('admin-modal-product').classList.add('active');
  },

  openEditModal(prodId) {
    const p = this.products.find(x => x.id === prodId);
    if (!p) return;

    this.activeEditingId = prodId;
    document.getElementById('modal-product-title').textContent = 'Edit Informasi Produk';
    document.getElementById('f-prod-name').value = p.name || '';
    document.getElementById('f-prod-category').value = p.category || 'LCD & Layar';
    document.getElementById('f-prod-price').value = p.price || '';
    document.getElementById('f-prod-orig-price').value = p.originalPrice || '';
    document.getElementById('f-prod-stock').value = p.stock || 20;
    document.getElementById('f-prod-image').value = p.image || '';
    document.getElementById('f-prod-shop').value = p.shopName || '168 Parts Official';
    document.getElementById('f-prod-location').value = p.location || 'Jakarta Barat';
    document.getElementById('f-prod-flash').checked = !!p.isFlashSale;
    document.getElementById('prod-img-preview').src = (p.image && !p.image.includes('unsplash.com')) ? p.image : 'images/product-placeholder.svg';

    document.getElementById('admin-modal-product').classList.add('active');
  },

  closeModal() {
    document.getElementById('admin-modal-product').classList.remove('active');
  },

  async handleSaveProduct(event) {
    event.preventDefault();
    const name = document.getElementById('f-prod-name').value.trim();
    const category = document.getElementById('f-prod-category').value;
    const price = Number(document.getElementById('f-prod-price').value);
    const originalPrice = Number(document.getElementById('f-prod-orig-price').value) || null;
    const stock = Number(document.getElementById('f-prod-stock').value) || 10;
    const image = document.getElementById('f-prod-image').value.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500';
    const shopName = document.getElementById('f-prod-shop').value.trim() || '168 Parts Official';
    const location = document.getElementById('f-prod-location').value.trim() || 'Jakarta Barat';
    const isFlashSale = document.getElementById('f-prod-flash').checked;

    const discountPercent = originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;

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
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${p ? p.name : prodId}"?`)) {
      return;
    }

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
        if (o) o.status = newStatus;
        this.showToast(`Status pesanan ${orderId} diubah ke: ${newStatus}`);
        this.renderOverviewRecent();
      }
    } catch (e) {
      console.error(e);
    }
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
    if (!confirm(`Apakah Anda yakin ingin menghapus voucher "${code}" dari sistem?`)) {
      return;
    }

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
    if (!confirm('Apakah Anda yakin ingin mengembalikan semua banner ke desain bawaan awal 168 Parts?')) {
      return;
    }

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

  showToast(message) {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      toast.style.cssText = `
        position: fixed; top: 20px; right: 24px; z-index: 99999;
        background: #1d3f0d; color: #ffffff; padding: 12px 20px;
        border-radius: 8px; font-weight: 700; font-size: 13.5px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25); transition: all 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
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
