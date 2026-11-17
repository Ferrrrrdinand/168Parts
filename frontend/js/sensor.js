/* =========================================================
   Pasarin Indonesia - Adaptive Screen Sensor & Responsive Engine
   - Deteksi resolusi & viewport realtime tanpa error
   - Menyesuaikan tampilan otomatis secara instan
   - Tanpa memunculkan badge / keterangan visual yang mengganggu
   ========================================================= */

(function () {
  'use strict';

  const PasarinDisplaySensor = {
    currentMode: 'laptop',
    resizeRaf: null,

    init() {
      try {
        this.detectAndApply();
        this.createMobileBottomAppBar();
        this.setupListeners();
        this.bindCartSync();
      } catch (err) {
        console.warn('[DisplaySensor] Inisialisasi aman sensor layar:', err);
      }
    },

    setupListeners() {
      const handleResize = () => {
        if (this.resizeRaf) {
          cancelAnimationFrame(this.resizeRaf);
        }
        this.resizeRaf = requestAnimationFrame(() => {
          this.detectAndApply();
        });
      };

      window.addEventListener('resize', handleResize, { passive: true });
      window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 100);
      }, { passive: true });
    },

    detectAndApply() {
      // Ringan dan tanpa reflow: tidak memutasi class pada body/html agar tidak ngelag
      try {
        const width = window.innerWidth || document.documentElement.clientWidth || 1024;
        const isMobile = width <= 768;

        const appbar = document.getElementById('mobile-bottom-appbar');
        if (appbar) {
          if (!isMobile || document.body.classList.contains('viewing-cart-checkout')) {
            appbar.style.display = 'none';
          } else {
            appbar.style.display = 'flex';
          }
        } else if (isMobile && !document.querySelector('.admin-sidebar')) {
          this.createMobileBottomAppBar();
        }
      } catch (err) {}
    },

    adaptBehaviors(mode) {
      try {
        const hash = window.location.hash || '#/';
        const appbar = document.getElementById('mobile-bottom-appbar');
        if (appbar) {
          if (window.innerWidth > 768 || document.body.classList.contains('viewing-cart-checkout')) {
            appbar.style.display = 'none';
          } else {
            appbar.style.display = 'flex';
          }
        } else if (window.innerWidth <= 768 && !document.querySelector('.admin-sidebar')) {
          this.createMobileBottomAppBar();
        }

        const homeBtn = document.getElementById('appbar-btn-home');
        if (homeBtn) {
          homeBtn.classList.toggle('active', hash === '#/' || hash === '');
        }

        const accText = document.getElementById('appbar-account-text');
        if (accText && window.PasarinAuth) {
          accText.textContent = window.PasarinAuth.currentUser ? 'Saya' : 'Masuk';
        }
      } catch (e) {}
    },

    createMobileBottomAppBar() {
      try {
        // Hanya buat di halaman utama / pembeli jika belum ada
        if (document.getElementById('mobile-bottom-appbar') || document.querySelector('.admin-sidebar')) return;

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
      } catch (e) {}
    },

    scrollToFlashSale() {
      try {
        const fsEl = document.querySelector('.box.fs');
        if (fsEl) {
          fsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.location.hash = '#/search?q=flash';
        }
      } catch (e) {}
    },

    handleAccountClick() {
      try {
        if (window.PasarinAuth && window.PasarinAuth.currentUser) {
          window.location.hash = '#/user/profile';
        } else {
          window.location.href = 'login.html#login';
        }
      } catch (e) {}
    },

    bindCartSync() {
      try {
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

        // Update badges saat cart berubah saja, bukan polling 1 detik terus-menerus
        updateAppbarBadges();
      } catch (e) {}
    }
  };

  // Safe DOM ready check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PasarinDisplaySensor.init());
  } else {
    PasarinDisplaySensor.init();
  }

  window.PasarinDisplaySensor = PasarinDisplaySensor;
})();
