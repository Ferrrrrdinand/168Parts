/* =========================================================
   Pasarin Indonesia - Dynamic Display Sensor & Adaptive Engine
   - Realtime Viewport & Resolution Detection
   - Mode HP (< 640px): Mobile App Navigation & Touch Optimization
   - Mode Laptop (>= 1024px): Widescreen Maximization
   ========================================================= */

const PasarinDisplaySensor = {
  currentMode: 'laptop',
  deviceBadgeEl: null,
  badgeTimeout: null,

  init() {
    this.createSensorBadge();
    this.createMobileBottomAppBar();
    this.detectAndApply();

    window.addEventListener('resize', () => {
      this.detectAndApply(true);
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.detectAndApply(true), 150);
    });

    this.bindCartSync();
  },

  createSensorBadge() {
    if (document.getElementById('display-sensor-indicator')) return;

    const badge = document.createElement('div');
    badge.id = 'display-sensor-indicator';
    badge.className = 'display-sensor-indicator';
    badge.innerHTML = `
      <span class="sensor-dot"></span>
      <span id="sensor-text-info">💻 Laptop (1280px)</span>
    `;

    document.body.appendChild(badge);
    this.deviceBadgeEl = badge;
  },

  createMobileBottomAppBar() {
    if (document.getElementById('mobile-bottom-appbar')) return;

    const bar = document.createElement('nav');
    bar.id = 'mobile-bottom-appbar';
    bar.className = 'mobile-bottom-appbar';
    bar.setAttribute('aria-label', 'Navigasi Mobile');
    bar.innerHTML = `
      <a class="mobile-appbar-item active" id="appbar-btn-home" href="#/">
        <span class="mobile-appbar-icon">🏠</span>
        <span>Beranda</span>
      </a>

      <a class="mobile-appbar-item" id="appbar-btn-fs" href="javascript:void(0)" onclick="PasarinDisplaySensor.scrollToFlashSale()">
        <span class="mobile-appbar-icon">⚡</span>
        <span>Flash Sale</span>
      </a>

      <a class="mobile-appbar-item" id="appbar-btn-promo" href="javascript:void(0)" onclick="if(window.PasarinApp) window.PasarinApp.openPromoModal()">
        <span class="mobile-appbar-icon">🎁</span>
        <span>Promo</span>
        <span class="mobile-appbar-badge" id="appbar-promo-badge">6</span>
      </a>

      <a class="mobile-appbar-item" id="appbar-btn-cart" href="javascript:void(0)" onclick="if(window.PasarinCart) window.PasarinCart.openDrawer()">
        <span class="mobile-appbar-icon">🛒</span>
        <span>Keranjang</span>
        <span class="mobile-appbar-badge" id="appbar-cart-badge" style="display:none;">0</span>
      </a>

      <a class="mobile-appbar-item" id="appbar-btn-account" href="javascript:void(0)" onclick="PasarinDisplaySensor.handleAccountClick()">
        <span class="mobile-appbar-icon">👤</span>
        <span id="appbar-account-text">Akun</span>
      </a>
    `;

    document.body.appendChild(bar);
  },

  detectAndApply(showNotification = false) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const body = document.body;

    let mode = 'laptop';
    let modeLabel = '';
    let modeIcon = '';

    if (width <= 640) {
      mode = 'mobile';
      modeLabel = `Mode HP (${width}px)`;
      modeIcon = '📱';
    } else if (width <= 1024) {
      mode = 'tablet';
      modeLabel = `Mode Tablet (${width}px)`;
      modeIcon = '📟';
    } else if (width <= 1439) {
      mode = 'laptop';
      modeLabel = `Mode Laptop (${width}px)`;
      modeIcon = '💻';
    } else {
      mode = 'widescreen';
      modeLabel = `Mode Layar Lebar (${width}px)`;
      modeIcon = '🖥️';
    }

    // Toggle classes on body
    body.classList.remove('device-mobile', 'device-tablet', 'device-laptop', 'device-widescreen');
    body.classList.add(`device-${mode}`);

    // Update state
    const prevMode = this.currentMode;
    this.currentMode = mode;

    // Update sensor badge
    const infoText = document.getElementById('sensor-text-info');
    if (infoText) {
      infoText.textContent = `${modeIcon} ${modeLabel}`;
    }

    if (showNotification || prevMode !== mode) {
      this.flashSensorBadge();
    }

    this.adaptBehaviors(mode);
  },

  flashSensorBadge() {
    document.body.classList.add('show-sensor-badge');
    clearTimeout(this.badgeTimeout);
    this.badgeTimeout = setTimeout(() => {
      document.body.classList.remove('show-sensor-badge');
    }, 2400);
  },

  adaptBehaviors(mode) {
    // Sync Bottom App Bar Active State
    const hash = window.location.hash || '#/';
    const homeBtn = document.getElementById('appbar-btn-home');
    if (homeBtn) {
      homeBtn.classList.toggle('active', hash === '#/' || hash === '');
    }

    // Update account text if logged in
    const accText = document.getElementById('appbar-account-text');
    if (accText && window.PasarinAuth) {
      accText.textContent = window.PasarinAuth.currentUser ? 'Saya' : 'Masuk';
    }
  },

  scrollToFlashSale() {
    const fsEl = document.querySelector('.box.fs');
    if (fsEl) {
      fsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.location.hash = '#/search?q=flash';
    }
  },

  handleAccountClick() {
    if (window.PasarinAuth && window.PasarinAuth.currentUser) {
      // Toggle user profile dropdown in header or open order history
      if (window.PasarinApp) {
        window.PasarinApp.openOrdersModal();
      }
    } else {
      window.location.href = 'login.html#login';
    }
  },

  bindCartSync() {
    // Observe cart updates and reflect on mobile bottom app bar
    const updateAppbarBadges = () => {
      const cartBadge = document.getElementById('appbar-cart-badge');
      const promoBadge = document.getElementById('appbar-promo-badge');

      if (cartBadge && window.PasarinCart) {
        const qty = window.PasarinCart.totalQuantity || 0;
        cartBadge.textContent = qty > 99 ? '99+' : qty;
        cartBadge.style.display = qty > 0 ? 'inline-block' : 'none';
      }

      if (promoBadge && window.PasarinApp) {
        const promoCount = window.PasarinApp.promos ? window.PasarinApp.promos.length : 6;
        promoBadge.textContent = promoCount;
      }
    };

    setInterval(updateAppbarBadges, 800);
  }
};

// Auto init when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PasarinDisplaySensor.init());
} else {
  PasarinDisplaySensor.init();
}

window.PasarinDisplaySensor = PasarinDisplaySensor;

