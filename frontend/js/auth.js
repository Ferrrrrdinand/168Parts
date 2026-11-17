/* =========================================================
   168 Parts Surabaya - Authentication & Points Reward Manager
   ========================================================= */

const PasarinPoints = {
  STORAGE_KEY: 'pasarin_user_points',

  getPoints() {
    const user = window.PasarinAuth?.currentUser;
    if (user && typeof user.points === 'number' && !isNaN(user.points)) {
      return user.points;
    }
    const val = localStorage.getItem(this.STORAGE_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  },

  setPoints(pts) {
    const cleanPts = Math.max(0, Math.floor(pts || 0));
    try {
      localStorage.setItem(this.STORAGE_KEY, cleanPts.toString());
    } catch (e) {}

    const user = window.PasarinAuth?.currentUser;
    if (user) {
      user.points = cleanPts;
      try {
        localStorage.setItem('pasarin_user', JSON.stringify(user));
      } catch (e) {}
    }

    this.renderPointsUI();
    return cleanPts;
  },

  addPoints(amount) {
    const current = this.getPoints();
    const cleanAmount = Math.max(0, Math.floor(amount || 0));
    const newTotal = current + cleanAmount;
    return this.setPoints(newTotal);
  },

  deductPoints(amount) {
    const current = this.getPoints();
    const cleanAmount = Math.max(0, Math.floor(amount || 0));
    const newTotal = Math.max(0, current - cleanAmount);
    return this.setPoints(newTotal);
  },

  calculatePoints(amount) {
    // 1 Poin per setiap kelipatan Rp 1.000 transaksi
    return Math.floor((amount || 0) / 1000);
  },

  renderPointsUI() {
    const points = this.getPoints();
    const formatted = points.toLocaleString('id-ID');

    document.querySelectorAll('.user-points-val, .nav-points-val').forEach(el => {
      el.textContent = formatted;
    });

    const displayCoin = document.getElementById('chk-coin-balance-display');
    if (displayCoin) {
      displayCoin.textContent = formatted;
    }
  }
};

window.PasarinPoints = PasarinPoints;

const PasarinAuth = {
  currentUser: null,
  pendingAction: null,

  init() {
    this.loadCachedUser();
    this.checkSession();
    this.bindEvents();
    this.ensureAuthModalDOM();
    if (window.PasarinPoints) window.PasarinPoints.renderPointsUI();
  },

  isLoggedIn() {
    if (this.currentUser && (this.currentUser.id || this.currentUser.email)) {
      return true;
    }
    try {
      const cached = localStorage.getItem('pasarin_user');
      if (cached) {
        const u = JSON.parse(cached);
        if (u && (u.id || u.email)) {
          this.currentUser = u;
          return true;
        }
      }
    } catch (e) {}
    return false;
  },

  loadCachedUser() {
    try {
      const cached = localStorage.getItem('pasarin_user');
      if (cached) {
        this.currentUser = JSON.parse(cached);
        this.renderNavbarUser();
      }
    } catch (e) {
      this.currentUser = null;
    }
  },

  async checkSession() {
    const token = PasarinAPI.getToken();
    if (!token) {
      this.currentUser = null;
      localStorage.removeItem('pasarin_user');
      this.renderNavbarUser();
      return;
    }

    const res = await PasarinAPI.getMe();
    if (res && res.success && res.user) {
      this.currentUser = res.user;
      localStorage.setItem('pasarin_user', JSON.stringify(res.user));
    } else if (res && !res.offline) {
      // Token tidak valid atau sesi habis
      this.currentUser = null;
      PasarinAPI.setToken(null);
      localStorage.removeItem('pasarin_user');
    }
    this.renderNavbarUser();
  },

  renderNavbarUser() {
    const userContainers = document.querySelectorAll('.auth-user-container');
    userContainers.forEach(container => {
      if (this.currentUser) {
        const initials = (this.currentUser.name || 'User')
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        const points = window.PasarinPoints ? window.PasarinPoints.getPoints() : 0;
        const formattedPoints = points.toLocaleString('id-ID');

        container.innerHTML = `
          <div class="user-dropdown-wrap">
            <button class="user-profile-btn" id="btn-user-profile" aria-label="Profil Pengguna">
              ${this.currentUser.avatar ? `<img src="${this.currentUser.avatar}" alt="Avatar" class="user-avatar" style="object-fit:cover; width:22px; height:22px; border-radius:50%;">` : `<span class="user-avatar">${initials}</span>`}
              <span class="user-name">${this.currentUser.name}</span>
              <span class="user-badge">${this.currentUser.role === 'admin' ? 'Admin' : 'Member'}</span>
              <span class="user-badge points-pill" title="Poin Belanja Anda: ${formattedPoints} Poin (1 Poin tiap Rp1.000)">🪙 <span class="nav-points-val">${formattedPoints}</span></span>
              <span class="user-caret">▾</span>
            </button>
            <div class="user-dropdown-menu" id="user-menu">
              <div class="user-menu-header">
                <div class="user-info-text">
                  <strong>${this.currentUser.name}</strong>
                  <small>${this.currentUser.email}</small>
                </div>
                <div class="user-menu-points-box" title="Setiap belanja Rp1.000 mendapatkan 1 Poin checkout" style="margin-top:10px; background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <div class="points-box-left" style="display:flex; align-items:center; gap:8px;">
                    <span class="points-box-icon" style="font-size:20px; line-height:1;">🪙</span>
                    <div class="points-box-info" style="display:flex; flex-direction:column; text-align:left;">
                      <span class="points-box-title" style="font-size:10.5px; color:#92400e; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-right:0;">Saldo Poin Belanja</span>
                      <strong class="points-box-val" style="font-size:14px; font-weight:800; color:#78350f; display:flex; align-items:center; gap:4px; margin-top:2px;">
                        <span class="user-points-val" style="color:#b45309; font-weight:900; font-size:15px; margin-right:0;">${formattedPoints}</span>
                        <span style="color:#78350f; font-weight:700; margin-right:0;">Poin</span>
                      </strong>
                    </div>
                  </div>
                  <span class="points-box-badge" style="font-size:10.5px; color:#78350f; background:#ffffff; border:1px solid #fde68a; padding:3px 8px; border-radius:6px; font-weight:800; box-shadow:0 1px 2px rgba(0,0,0,0.05); margin-right:0; white-space:nowrap;">1 Poin/Rp1rb</span>
                </div>
              </div>
              <hr class="user-menu-divider">
              <a href="#/user/profile" class="user-menu-item" id="btn-nav-profile">
                <span class="menu-icon">👤</span>
                <span class="menu-text">Akun Saya (Profil)</span>
              </a>
              <a href="#/jual-barang" class="user-menu-item" id="btn-nav-sell-item" style="color:#be123c; font-weight:700;">
                <span class="menu-icon">📦</span>
                <span class="menu-text">Titip Jual Barang (QC & Transfer)</span>
              </a>
              <a href="admin.html" class="user-menu-item" id="btn-nav-seller-admin">
                <span class="menu-icon">⚙️</span>
                <span class="menu-text">Kanal Penjual (Admin)</span>
              </a>
              <a href="#/orders" class="user-menu-item" id="btn-nav-orders">
                <span class="menu-icon">📦</span>
                <span class="menu-text">Pesanan Saya</span>
              </a>
              <a href="javascript:void(0)" class="user-menu-item" id="btn-nav-addresses">
                <span class="menu-icon">📍</span>
                <span class="menu-text">Alamat Pengiriman Saya</span>
              </a>
              <button class="user-menu-item text-danger" id="btn-nav-logout">
                <span class="menu-icon">🚪</span>
                <span class="menu-text">Keluar (Logout)</span>
              </button>
            </div>
          </div>
        `;

        const profileBtn = container.querySelector('#btn-user-profile');
        const userMenu = container.querySelector('#user-menu');
        if (profileBtn && userMenu) {
          profileBtn.onclick = (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('show');
          };
        }

        const logoutBtn = container.querySelector('#btn-nav-logout');
        if (logoutBtn) {
          logoutBtn.onclick = (e) => {
            e.preventDefault();
            this.logout();
          };
        }

        const ordersBtn = container.querySelector('#btn-nav-orders');
        if (ordersBtn) {
          ordersBtn.onclick = (e) => {
            e.preventDefault();
            if (window.PasarinApp) {
              window.PasarinApp.openOrdersModal();
            }
            if (userMenu) userMenu.classList.remove('show');
          };
        }

        const addressesBtn = container.querySelector('#btn-nav-addresses');
        if (addressesBtn) {
          addressesBtn.onclick = (e) => {
            e.preventDefault();
            if (window.PasarinAddressBook) {
              window.PasarinAddressBook.openModal();
            }
            if (userMenu) userMenu.classList.remove('show');
          };
        }
      } else {
        container.innerHTML = `
          <a class="auth-link" href="javascript:void(0)" onclick="window.PasarinAuth.openAuthModal('register')"><b>Daftar</b></a>
          <span class="auth-divider">|</span>
          <a class="auth-link" href="javascript:void(0)" onclick="window.PasarinAuth.openAuthModal('login')"><b>Log In</b></a>
        `;
      }
    });
  },

  async login(email, password) {
    const res = await PasarinAPI.login({ email, password });
    if (res && res.success) {
      PasarinAPI.setToken(res.token);
      this.currentUser = res.user;
      localStorage.setItem('pasarin_user', JSON.stringify(res.user));
      this.renderNavbarUser();
      if (window.PasarinCart) {
        window.PasarinCart.loadCart();
      }
      return { success: true, message: res.message, user: res.user };
    }
    return {
      success: false,
      message: res ? res.message : 'Gagal login. Periksa email dan password.'
    };
  },

  async register(name, email, phone, password, address = '', coords = null) {
    const payload = {
      name,
      email,
      phone,
      password,
      address,
      latitude: coords ? coords.lat : null,
      longitude: coords ? coords.lng : null
    };
    const res = await PasarinAPI.register(payload);
    if (res && res.success) {
      PasarinAPI.setToken(res.token);
      this.currentUser = res.user;
      localStorage.setItem('pasarin_user', JSON.stringify(res.user));
      this.renderNavbarUser();
      if (window.PasarinCart) {
        window.PasarinCart.loadCart();
      }
      return { success: true, message: res.message, user: res.user };
    }
    return {
      success: false,
      message: res ? res.message : 'Gagal mendaftar. Silakan coba kembali.'
    };
  },

  async logout() {
    await PasarinAPI.logout();
    this.currentUser = null;
    localStorage.removeItem('pasarin_user');
    PasarinAPI.setToken(null);
    this.renderNavbarUser();
    if (window.PasarinCart) {
      window.PasarinCart.loadCart();
    }
    if (window.showToast) {
      window.showToast('Anda telah berhasil keluar.', 'info');
    }
  },

  /* =========================================================
     MEMBER AUTHENTICATION GATE MODAL
     Diwajibkan saat Tambah ke Keranjang / Checkout
     ========================================================= */
  ensureAuthModalDOM() {
    let modal = document.getElementById('member-gate-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'member-gate-modal';
      modal.className = 'pasarin-modal-overlay';
      modal.onclick = (e) => {
        if (e.target === modal) this.closeAuthModal();
      };

      modal.innerHTML = `
        <div class="pasarin-modal-card member-gate-card">
          <div class="member-gate-header">
            <div class="member-gate-badge">
              <span class="badge-icon">👑</span>
              <span class="badge-text">MEMBER RESMI 168 PARTS</span>
            </div>
            <button type="button" class="member-gate-close" onclick="window.PasarinAuth.closeAuthModal()" title="Tutup">&times;</button>
          </div>

          <div class="member-gate-body">
            <div class="member-gate-banner">
              <div class="gate-banner-icon">🔒</div>
              <div class="gate-banner-info">
                <h3 id="member-gate-title">Masuk atau Daftar Member Terlebih Dahulu</h3>
                <p id="member-gate-subtitle">Untuk menambahkan produk ke keranjang belanja atau melakukan checkout pesanan, Anda wajib masuk sebagai Member Resmi 168 Parts.</p>
              </div>
            </div>

            <div class="member-gate-perks">
              <div class="gate-perk-item" title="Jaminan garansi tes sparepart aman">
                <span class="perk-icon">🛡️</span>
                <span>Garansi Resmi</span>
              </div>
              <div class="gate-perk-item" title="Dapatkan 1 poin setiap Rp1.000 belanja">
                <span class="perk-icon">🪙</span>
                <span>Poin Belanja</span>
              </div>
              <div class="gate-perk-item" title="Kirim langsung dari Surabaya hari ini">
                <span class="perk-icon">⚡</span>
                <span>Kirim Cepat</span>
              </div>
            </div>

            <!-- Tab Switcher -->
            <div class="member-gate-tabs">
              <button type="button" class="gate-tab-btn active" id="gate-tab-login" onclick="window.PasarinAuth.switchAuthTab('login')">Masuk (Log In)</button>
              <button type="button" class="gate-tab-btn" id="gate-tab-register" onclick="window.PasarinAuth.switchAuthTab('register')">Daftar Member Baru</button>
            </div>

            <div id="gate-auth-alert" class="gate-auth-alert" style="display:none;"></div>

            <!-- Form Login -->
            <form id="gate-form-login" class="gate-auth-form" onsubmit="window.PasarinAuth.submitGateLogin(event)">
              <div class="gate-form-group">
                <label class="gate-label" for="gate-login-email">Email atau Nomor Handphone</label>
                <div class="gate-input-wrap">
                  <span class="gate-input-icon">✉️</span>
                  <input type="text" id="gate-login-email" class="gate-input" placeholder="contoh: budi@gmail.com" required autocomplete="username">
                </div>
              </div>
              <div class="gate-form-group">
                <label class="gate-label" for="gate-login-password">Password</label>
                <div class="gate-input-wrap">
                  <span class="gate-input-icon">🔑</span>
                  <input type="password" id="gate-login-password" class="gate-input" placeholder="Masukkan password Anda" required autocomplete="current-password">
                  <button type="button" class="gate-pwd-toggle" onclick="window.PasarinAuth.togglePasswordVisibility('gate-login-password')" title="Lihat password">👁️</button>
                </div>
              </div>

              <button type="submit" class="gate-btn-submit" id="gate-btn-login-submit">
                <span>Masuk Sebagai Member</span>
                <span class="gate-btn-arrow">&rsaquo;</span>
              </button>

              <div class="gate-quick-demo">
                <button type="button" class="gate-btn-demo" onclick="window.PasarinAuth.loginDemoMember()">
                  <span>⚡ Masuk Cepat Akun Demo (Budi Santoso)</span>
                </button>
              </div>
            </form>

            <!-- Form Register -->
            <form id="gate-form-register" class="gate-auth-form" style="display:none;" onsubmit="window.PasarinAuth.submitGateRegister(event)">
              <div class="gate-form-group">
                <label class="gate-label" for="gate-reg-name">Nama Lengkap / Nama Konter Servis</label>
                <div class="gate-input-wrap">
                  <span class="gate-input-icon">👤</span>
                  <input type="text" id="gate-reg-name" class="gate-input" placeholder="contoh: Budi Santoso / Budi Servis" required autocomplete="name">
                </div>
              </div>
              <div class="gate-form-group">
                <label class="gate-label" for="gate-reg-phone">Nomor WhatsApp / HP Aktif</label>
                <div class="gate-input-wrap">
                  <span class="gate-input-icon">📱</span>
                  <input type="tel" id="gate-reg-phone" class="gate-input" placeholder="contoh: 081234567890" required autocomplete="tel">
                </div>
              </div>
              <div class="gate-form-group">
                <label class="gate-label" for="gate-reg-email">Alamat Email</label>
                <div class="gate-input-wrap">
                  <span class="gate-input-icon">✉️</span>
                  <input type="email" id="gate-reg-email" class="gate-input" placeholder="contoh: budi@gmail.com" required autocomplete="email">
                </div>
              </div>
              <div class="gate-form-group">
                <label class="gate-label" for="gate-reg-password">Password (Minimal 8 Karakter)</label>
                <div class="gate-input-wrap">
                  <span class="gate-input-icon">🔒</span>
                  <input type="password" id="gate-reg-password" class="gate-input" placeholder="Minimal 8 karakter kombinasi huruf & angka" required autocomplete="new-password">
                  <button type="button" class="gate-pwd-toggle" onclick="window.PasarinAuth.togglePasswordVisibility('gate-reg-password')" title="Lihat password">👁️</button>
                </div>
              </div>

              <button type="submit" class="gate-btn-submit" id="gate-btn-reg-submit">
                <span>Daftar Jadi Member Resmi</span>
                <span class="gate-btn-arrow">&rsaquo;</span>
              </button>
            </form>

            <div class="member-gate-footer">
              <a href="login.html" target="_blank" class="gate-full-link">Buka Halaman Masuk Lengkap di Tab Baru &nearr;</a>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }
    return modal;
  },

  openAuthModal(reason = 'default', pendingAction = null) {
    this.pendingAction = pendingAction;
    const modal = this.ensureAuthModalDOM();

    const titleEl = document.getElementById('member-gate-title');
    const subtitleEl = document.getElementById('member-gate-subtitle');

    if (reason === 'cart') {
      if (titleEl) titleEl.textContent = 'Wajib Masuk / Daftar Member';
      if (subtitleEl) subtitleEl.textContent = 'Untuk menambahkan produk ke keranjang belanja, Anda wajib masuk atau mendaftar sebagai Member Resmi 168 Parts.';
    } else if (reason === 'buy_now') {
      if (titleEl) titleEl.textContent = 'Wajib Masuk / Daftar Member';
      if (subtitleEl) subtitleEl.textContent = 'Untuk melakukan pembelian langsung (Beli Sekarang), Anda wajib masuk atau mendaftar sebagai Member Resmi 168 Parts.';
    } else if (reason === 'checkout') {
      if (titleEl) titleEl.textContent = 'Wajib Masuk / Daftar Member';
      if (subtitleEl) subtitleEl.textContent = 'Untuk menyelesaikan pemesanan dan checkout, Anda wajib masuk atau mendaftar sebagai Member Resmi 168 Parts.';
    } else {
      if (titleEl) titleEl.textContent = 'Masuk atau Daftar Member Terlebih Dahulu';
      if (subtitleEl) subtitleEl.textContent = 'Nikmati harga grosir teknisi, garansi resmi sparepart, dan reward poin belanja di 168 Parts Surabaya.';
    }

    this.switchAuthTab(reason === 'register' ? 'register' : 'login');
    this.showGateAlert(null);

    modal.classList.add('active');
  },

  closeAuthModal() {
    const modal = document.getElementById('member-gate-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  switchAuthTab(tab) {
    const btnLogin = document.getElementById('gate-tab-login');
    const btnReg = document.getElementById('gate-tab-register');
    const formLogin = document.getElementById('gate-form-login');
    const formReg = document.getElementById('gate-form-register');

    if (tab === 'register') {
      if (btnLogin) btnLogin.classList.remove('active');
      if (btnReg) btnReg.classList.add('active');
      if (formLogin) formLogin.style.display = 'none';
      if (formReg) formReg.style.display = 'block';
    } else {
      if (btnReg) btnReg.classList.remove('active');
      if (btnLogin) btnLogin.classList.add('active');
      if (formReg) formReg.style.display = 'none';
      if (formLogin) formLogin.style.display = 'block';
    }
    this.showGateAlert(null);
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  },

  showGateAlert(msg, type = 'error') {
    const alertEl = document.getElementById('gate-auth-alert');
    if (!alertEl) return;
    if (!msg) {
      alertEl.style.display = 'none';
      alertEl.textContent = '';
      alertEl.className = 'gate-auth-alert';
      return;
    }
    alertEl.textContent = msg;
    alertEl.className = `gate-auth-alert ${type}`;
    alertEl.style.display = 'block';
  },

  async submitGateLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('gate-login-email')?.value?.trim();
    const password = document.getElementById('gate-login-password')?.value;
    const btn = document.getElementById('gate-btn-login-submit');

    if (!email || !password) {
      this.showGateAlert('Silakan masukkan email dan password Anda.', 'error');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Memverifikasi Akun...</span>';
    }

    try {
      const res = await this.login(email, password);
      if (res && res.success) {
        this.onAuthSuccess(res.user, res.message || `Selamat datang kembali, ${res.user.name}!`);
      } else {
        // Cek jika akun cocok dengan demo
        if (email.toLowerCase() === 'demo@pasarin.com' && password === 'demo123') {
          return this.loginDemoMember();
        }
        this.showGateAlert(res?.message || 'Email atau password salah. Silakan periksa kembali.', 'error');
      }
    } catch (err) {
      this.showGateAlert('Terjadi kendala saat login. Silakan coba kembali.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Masuk Sebagai Member</span><span class="gate-btn-arrow">&rsaquo;</span>';
      }
    }
  },

  async submitGateRegister(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('gate-reg-name')?.value?.trim();
    const phone = document.getElementById('gate-reg-phone')?.value?.trim();
    const email = document.getElementById('gate-reg-email')?.value?.trim();
    const password = document.getElementById('gate-reg-password')?.value;
    const btn = document.getElementById('gate-btn-reg-submit');

    if (!name || !email || !password) {
      this.showGateAlert('Nama lengkap, email, dan password wajib diisi!', 'error');
      return;
    }

    if (password.length < 8) {
      this.showGateAlert('Password minimal 8 karakter!', 'error');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Mendaftarkan Member...</span>';
    }

    try {
      const res = await this.register(name, email, phone, password);
      if (res && res.success) {
        this.onAuthSuccess(res.user, `Selamat, ${res.user.name}! Anda resmi terdaftar sebagai Member.`);
      } else {
        // Fallback registrasi offline jika server backend sedang tidur/offline
        const offlineUser = {
          id: 'user-' + Date.now(),
          name: name,
          email: email.toLowerCase(),
          phone: phone || '',
          address: 'Kota Surabaya, Jawa Timur',
          role: 'buyer',
          points: 100
        };
        this.onAuthSuccess(offlineUser, `Selamat, ${offlineUser.name}! Pendaftaran Member Berhasil.`);
      }
    } catch (err) {
      this.showGateAlert('Terjadi kendala saat pendaftaran. Silakan coba kembali.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Daftar Jadi Member Resmi</span><span class="gate-btn-arrow">&rsaquo;</span>';
      }
    }
  },

  async loginDemoMember() {
    this.showGateAlert('Menghubungkan akun member demo...', 'success');
    const demoUser = {
      id: 'user-demo-1',
      name: 'Budi Santoso (Teknisi)',
      email: 'demo@pasarin.com',
      phone: '0812-3456-7890',
      address: 'Jl. Pemuda No. 168, Genteng, Kota Surabaya, Jawa Timur 60271',
      role: 'buyer',
      points: 500
    };

    try {
      const res = await this.login('demo@pasarin.com', 'demo123');
      if (res && res.success) {
        this.onAuthSuccess(res.user, 'Berhasil masuk dengan Akun Member Demo!');
        return;
      }
    } catch (e) {}

    // Fallback instant demo login
    this.onAuthSuccess(demoUser, 'Berhasil masuk dengan Akun Member Demo (Budi Santoso)!');
  },

  onAuthSuccess(user, message) {
    this.currentUser = user;
    localStorage.setItem('pasarin_user', JSON.stringify(user));
    if (!PasarinAPI.getToken()) {
      PasarinAPI.setToken('member-token-' + (user.id || Date.now()));
    }
    this.renderNavbarUser();
    this.closeAuthModal();

    if (window.showToast) {
      window.showToast(message || `Selamat datang, ${user.name}!`, 'success');
    } else if (window.PasarinApp?.showToast) {
      window.PasarinApp.showToast(message || `Selamat datang, ${user.name}!`);
    }

    // Eksekusi aksi yang tertunda (tambah keranjang / checkout)
    this.executePendingAction();
  },

  executePendingAction() {
    if (!this.pendingAction) return;
    const pending = this.pendingAction;
    this.pendingAction = null;

    if (pending.action === 'add_to_cart') {
      if (window.PasarinCart) {
        setTimeout(() => {
          window.PasarinCart.addToCart(pending.productId, pending.quantity, pending.variation, pending.originEl);
        }, 150);
      }
    } else if (pending.action === 'buy_now') {
      if (window.PasarinCart) {
        setTimeout(async () => {
          await window.PasarinCart.addToCart(pending.productId, pending.quantity, pending.variation, pending.originEl);
          if (window.PasarinApp?.closeProductDetail) {
            window.PasarinApp.closeProductDetail();
          }
          window.PasarinCart.handleCheckoutClick();
        }, 150);
      }
    } else if (pending.action === 'checkout') {
      if (window.PasarinCart) {
        setTimeout(() => {
          window.PasarinCart.handleCheckoutClick();
        }, 150);
      }
    } else if (pending.action === 'checkout_modal') {
      if (window.PasarinCart) {
        setTimeout(() => {
          window.PasarinCart.openCheckoutModal(pending.selectedItems);
        }, 150);
      }
    }
  },

  bindEvents() {
    document.addEventListener('click', () => {
      document.querySelectorAll('.user-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    });
  }
};

window.PasarinAuth = PasarinAuth;
