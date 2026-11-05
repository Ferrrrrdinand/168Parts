/* =========================================================
   Pasarin Indonesia - Authentication & Points Reward Manager
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

  init() {
    this.loadCachedUser();
    this.checkSession();
    this.bindEvents();
    if (window.PasarinPoints) window.PasarinPoints.renderPointsUI();
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
              <span class="user-avatar">${initials}</span>
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
                <div class="user-menu-points-box" title="Setiap belanja Rp1.000 mendapatkan 1 Poin checkout">
                  <div class="points-box-left">
                    <span class="points-box-icon">🪙</span>
                    <div class="points-box-info">
                      <span class="points-box-title">Saldo Poin Belanja</span>
                      <strong class="points-box-val"><span class="user-points-val">${formattedPoints}</span> Poin</strong>
                    </div>
                  </div>
                  <span class="points-box-badge">1 Poin/Rp1rb</span>
                </div>
              </div>
              <hr class="user-menu-divider">
              <a href="#/user/profile" class="user-menu-item" id="btn-nav-profile">
                <span class="menu-icon">👤</span>
                <span class="menu-text">Akun Saya (Profil)</span>
              </a>
              <a href="#" class="user-menu-item" id="btn-nav-crud">
                <span class="menu-icon">⚙️</span>
                <span class="menu-text">Kanal Penjual (CRUD Produk)</span>
              </a>
              <a href="admin.html" class="user-menu-item" id="btn-nav-seller-admin">
                <span class="menu-icon">👑</span>
                <span class="menu-text">Seller & Admin Centre</span>
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

        const crudBtn = container.querySelector('#btn-nav-crud');
        if (crudBtn) {
          crudBtn.onclick = (e) => {
            e.preventDefault();
            if (window.PasarinApp) {
              window.PasarinApp.openProductCrudModal();
            }
            if (userMenu) userMenu.classList.remove('show');
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
          <a class="auth-link" href="login.html#register" id="btn-nav-register"><b>Daftar</b></a>
          <span class="auth-divider">|</span>
          <a class="auth-link" href="login.html#login" id="btn-nav-login"><b>Log In</b></a>
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

  bindEvents() {
    document.addEventListener('click', () => {
      document.querySelectorAll('.user-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    });
  }
};

window.PasarinAuth = PasarinAuth;

