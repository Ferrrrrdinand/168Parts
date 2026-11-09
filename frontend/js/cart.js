/* =========================================================
   168 Parts Surabaya - Cart & Checkout Manager
   ========================================================= */

const PasarinCart = {
  items: [],
  appliedVoucher: null,
  useCoins: false,
  redeemedCoins: 0,
  totalQuantity: 0,
  subtotal: 0,

  init() {
    this.createCartDrawerDOM();
    this.loadCart();
    this.bindCartTriggers();
  },

  toggleUseCoins(checked) {
    this.useCoins = !!checked;
    this.renderCheckoutPage();
  },

  formatRupiah(num) {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  },

  async loadCart() {
    try {
      const localStr = localStorage.getItem('pasarin_local_cart');
      const storedItems = localStr ? JSON.parse(localStr) : [];
      this.items = Array.isArray(storedItems)
        ? storedItems.filter(item => item && typeof item.productId === 'string')
        : [];

      const legacyDemoIds = new Set(['prod_goojodoq_1', 'prod_ringke_1']);
      const cleanItems = this.items.filter(item => !legacyDemoIds.has(item.productId));
      if (cleanItems.length !== this.items.length) {
        this.items = cleanItems;
        localStorage.setItem('pasarin_local_cart', JSON.stringify(this.items));
      }
      localStorage.setItem('pasarin_cart_initialized', 'true');
    } catch (e) {
      console.warn('[PasarinCart] Keranjang lokal tidak dapat dibaca:', e);
      this.items = [];
    }

    this.items.forEach(it => {
      if (typeof it.selected === 'undefined') it.selected = true;
    });

    this.totalQuantity = this.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    this.subtotal = this.items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0);

    this.updateCartBadge();
    this.renderCartDrawer();
    if (window.location.hash === '#/cart') {
      this.renderCartPage();
    }
  },

  updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const displayCount = this.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    this.totalQuantity = displayCount;
    badges.forEach(b => {
      if (displayCount <= 0) {
        b.textContent = '0';
        b.style.display = 'none';
      } else {
        b.textContent = displayCount > 99 ? '99+' : displayCount;
        b.style.display = 'inline-flex';
      }
    });
  },

  async addToCart(productId, quantity = 1, variation = null) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // 1. Dapatkan data lengkap produk dari katalog atau item yang sudah ada
    let p = window.PasarinApp?.products?.find(x => x.id === productId);
    if (!p) {
      const existing = this.items.find(x => x.productId === productId);
      if (existing) {
        p = {
          id: existing.productId,
          name: existing.name,
          price: existing.price,
          originalPrice: existing.originalPrice,
          image: existing.image,
          icon: existing.icon,
          shopName: existing.shopName,
          shopType: existing.shopBadge === 'Mall ORI' ? 'Mall' : 'Star+'
        };
      } else {
        p = {
          id: productId,
          name: 'Produk Pilihan',
          price: 150000,
          originalPrice: 200000,
          image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80',
          shopName: '168 Parts Official Store',
          shopType: 'Mall'
        };
      }
    }

    // 2. Tambahkan atau naikkan kuantitas produk di this.items
    const existingIndex = this.items.findIndex(it => it.productId === productId);
    if (existingIndex > -1) {
      this.items[existingIndex].quantity = (this.items[existingIndex].quantity || 0) + qty;
      this.items[existingIndex].itemTotal = this.items[existingIndex].quantity * this.items[existingIndex].price;
      this.items[existingIndex].selected = true;
    } else {
      this.items.unshift({
        productId: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice || p.price,
        image: p.image || null,
        icon: p.icon || 'bag',
        shopName: p.shopName || (p.shopType ? p.shopType + ' Official Store' : '168 Parts Official Store'),
        shopBadge: p.shopType === 'Mall' ? 'Mall ORI' : 'Star+',
        variation: variation || p.selectedVariation || 'Standar',
        quantity: qty,
        selected: true,
        itemTotal: p.price * qty
      });
    }

    // 3. Simpan state keranjang ke localStorage & perbarui badge angka
    this.saveCartState();
    this.updateCartBadge();
    this.animateCartBadge();

    // 4. Tampilkan dialog notifikasi Shopee "Berhasil Ditambahkan ke Keranjang"
    this.showAddToCartSuccessModal(p, qty);

    // 5. Jika sedang di halaman keranjang (#/cart), refresh tampilan tabel secara reaktif
    if (window.location.hash === '#/cart') {
      this.renderCartPage();
    }

    // 6. Sinkronisasi API backend di latar belakang (non-blocking)
    try {
      if (window.PasarinAPI && window.PasarinAPI.addToCart) {
        window.PasarinAPI.addToCart(productId, qty).catch(() => {});
      }
    } catch (e) {}
  },

  animateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      b.classList.remove('bounce-badge');
      void b.offsetWidth;
      b.classList.add('bounce-badge');
    });
  },

  showAddToCartSuccessModal(product, quantity) {
    const modalId = 'add-to-cart-success-dialog';
    let dialog = document.getElementById(modalId);
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = modalId;
      dialog.className = 'cart-popup-overlay';
      document.body.appendChild(dialog);
    }

    const img = product.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80';
    const totalCount = this.items.reduce((acc, it) => acc + (it.quantity || 1), 0);

    dialog.innerHTML = `
      <div class="cart-popup-card">
        <div class="cart-popup-header">
          <div class="cart-popup-icon">✓</div>
          <div class="cart-popup-title">Produk Berhasil Ditambahkan ke Keranjang</div>
          <button class="cart-popup-close" onclick="PasarinCart.closeAddToCartModal()">&times;</button>
        </div>

        <div class="cart-popup-body">
          <img src="${img}" alt="${product.name}" class="cart-popup-img" onerror="this.src='https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80'">
          <div class="cart-popup-info">
            <h4 class="cart-popup-pname">${product.name}</h4>
            <div class="cart-popup-meta">
              <span class="meta-qty">+${quantity} item</span>
              <span class="meta-sep">•</span>
              <span class="meta-price">${this.formatRupiah(product.price)}</span>
            </div>
            <div class="cart-popup-status">
              Total keranjang: <b>${totalCount} produk</b> (${this.formatRupiah(this.subtotal)})
            </div>
          </div>
        </div>

        <div class="cart-popup-footer">
          <button type="button" class="btn-popup-continue" onclick="PasarinCart.closeAddToCartModal()">
            Lanjut Belanja
          </button>
          <button type="button" class="btn-popup-cart" onclick="PasarinCart.closeAddToCartModal(); window.location.hash = '#/cart';">
            Lihat Keranjang Belanja &rsaquo;
          </button>
        </div>
      </div>
    `;

    dialog.classList.add('active');

    if (this._popupTimer) clearTimeout(this._popupTimer);
    this._popupTimer = setTimeout(() => {
      this.closeAddToCartModal();
    }, 6000);
  },

  closeAddToCartModal() {
    const dialog = document.getElementById('add-to-cart-success-dialog');
    if (dialog) dialog.classList.remove('active');
  },

  async updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      await this.removeItem(productId);
      return;
    }
    const res = await PasarinAPI.updateCartItem(productId, quantity);
    if (res && res.success) {
      await this.loadCart();
    } else {
      // local update
      let local = JSON.parse(localStorage.getItem('pasarin_local_cart') || '[]');
      const it = local.find(x => x.productId === productId);
      if (it) {
        it.quantity = quantity;
        it.itemTotal = it.price * quantity;
      }
      localStorage.setItem('pasarin_local_cart', JSON.stringify(local));
      await this.loadCart();
    }
  },

  confirmRemoveItem(productId) {
    const item = this.items.find(x => x.productId === productId);
    const itemName = item ? item.name : 'produk ini';
    this.showConfirmDeleteDialog({
      title: 'Hapus Produk',
      message: `Apakah Anda yakin ingin menghapus "${itemName}" dari keranjang belanja?`,
      onConfirm: () => this.removeItem(productId)
    });
  },

  async removeItem(productId) {
    this.items = this.items.filter(x => x.productId !== productId);
    this.saveCartState();
    this.updateCartBadge();
    this.renderCartPage();
    this.renderCartDrawer();

    if (window.showToast) {
      window.showToast('Produk berhasil dihapus dari keranjang', 'info');
    }

    try {
      if (window.PasarinAPI && window.PasarinAPI.removeFromCart) {
        window.PasarinAPI.removeFromCart(productId).catch(() => {});
      }
    } catch (e) {}
  },

  showConfirmDeleteDialog({ title, message, onConfirm }) {
    const modalId = 'cart-confirm-delete-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'pasarin-modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="pasarin-modal-card shopee-confirm-card" style="max-width: 440px; padding: 24px 28px; border-radius: 6px; text-align: left;">
        <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">${title || 'Hapus Produk'}</h3>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">${message}</p>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button type="button" class="btn-shopee-dialog-cancel" id="btn-dialog-cancel">Nanti Saja</button>
          <button type="button" class="btn-shopee-dialog-confirm" id="btn-dialog-confirm">HAPUS</button>
        </div>
      </div>
    `;

    modal.querySelector('#btn-dialog-cancel').onclick = () => {
      modal.classList.remove('active');
    };

    modal.querySelector('#btn-dialog-confirm').onclick = () => {
      modal.classList.remove('active');
      if (typeof onConfirm === 'function') onConfirm();
    };

    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('active');
    };

    modal.classList.add('active');
  },

  async clearCart() {
    this.items = [];
    this.saveCartState();
    this.updateCartBadge();
    if (window.location.hash === '#/cart') {
      this.renderCartPage();
    }
    this.renderCartDrawer();
    try {
      if (window.PasarinAPI && window.PasarinAPI.clearCart) {
        window.PasarinAPI.clearCart().catch(() => {});
      }
    } catch (e) {}
  },

  createCartDrawerDOM() {
    if (document.getElementById('cart-drawer-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'cart-drawer-overlay';
    overlay.className = 'cart-overlay';
    overlay.innerHTML = `
      <div class="cart-drawer" id="cart-drawer">
        <div class="cart-header">
          <div class="cart-title">
            <svg class="i"><use href="#cart"/></svg>
            <h3>Keranjang Belanja (<span id="cart-drawer-count">0</span>)</h3>
          </div>
          <button class="cart-close-btn" id="btn-cart-close" aria-label="Tutup Keranjang">&times;</button>
        </div>

        <div class="cart-body" id="cart-drawer-body">
          <!-- Item keranjang dirender di sini -->
        </div>

        <div class="cart-footer" id="cart-drawer-footer">
          <div class="cart-summary-row">
            <span>Subtotal Produk</span>
            <strong id="cart-summary-total">Rp0</strong>
          </div>
          <p class="cart-shipping-note">Biaya ongkir & diskon dihitung saat checkout</p>
          <button class="btn-checkout" id="btn-cart-checkout">Checkout Sekarang</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeDrawer();
    });

    document.getElementById('btn-cart-close')?.addEventListener('click', () => this.closeDrawer());
    document.getElementById('btn-cart-checkout')?.addEventListener('click', () => this.handleCheckoutClick());
  },

  bindCartTriggers() {
    document.addEventListener('click', (e) => {
      const cartBtn = e.target.closest('.cart-trigger-btn, .cart');
      if (cartBtn) {
        e.preventDefault();
        window.location.hash = '#/cart';
      }
    });
  },

  /* =========================================================
     Shopee Full Cart Page (#/cart) Methods
     ========================================================= */
  renderCartPage() {
    const listEl = document.getElementById('cart-store-groups-list');
    const stickyBar = document.getElementById('cart-sticky-bar');
    const headBar = document.querySelector('.cart-table-head');
    if (!listEl) return;

    if (!this.items || this.items.length === 0) {
      if (headBar) headBar.style.display = 'none';
      if (stickyBar) stickyBar.style.display = 'none';
      listEl.innerHTML = `
        <div class="cart-empty-page-state">
          <div class="empty-icon">🛒</div>
          <h3>Keranjang belanja Anda masih kosong</h3>
          <p>Banyak produk menarik dan promo spesial menunggumu!</p>
          <a href="#/" class="btn-go-shop">Mulai Belanja Sekarang</a>
        </div>
      `;
      return;
    }

    if (headBar) headBar.style.display = 'flex';
    if (stickyBar) stickyBar.style.display = 'block';

    // Group items by shopName
    const storeMap = {};
    this.items.forEach(it => {
      const shop = it.shopName || '168 Parts Official Store';
      if (!storeMap[shop]) {
        storeMap[shop] = {
          shopName: shop,
          badge: it.shopBadge || 'Mall ORI',
          comboPromo: it.comboPromo || null,
          storeVoucher: it.storeVoucher || null,
          items: []
        };
      }
      storeMap[shop].items.push(it);
    });

    const stores = Object.values(storeMap);

    listEl.innerHTML = stores.map(store => {
      const isStoreAllSelected = store.items.length > 0 && store.items.every(x => x.selected);
      const safeStoreName = store.shopName.replace(/'/g, "\\'");

      const itemsHtml = store.items.map(it => {
        const itemImg = (it.image && !it.image.includes('unsplash.com')) ? it.image : 'images/product-placeholder.svg';
        return `
          <div class="cart-item-row" data-product-id="${it.productId}">
            <div class="cart-item-prod">
              <label class="custom-chk-label">
                <input type="checkbox" ${it.selected ? 'checked' : ''} onchange="PasarinCart.toggleItemSelect('${it.productId}', this.checked)">
                <span class="custom-chk-box"></span>
              </label>
              <img src="${itemImg}" alt="${it.name}" class="cart-prod-thumb" onerror="this.src='images/product-placeholder.svg'">
              <div class="cart-prod-info">
                <a href="#/search?q=${encodeURIComponent(it.name)}" class="cart-prod-title">${it.name}</a>
                <div class="cart-prod-tags">
                  <span class="badge-cicilan">CICILAN 0%</span>
                </div>
              </div>
              <div class="cart-prod-variation">
                <span class="var-label">Variasi: ▾</span>
                <span class="var-val">${it.variation || 'Standar'}</span>
              </div>
            </div>

            <div class="cart-item-price-col th-col th-price">
              ${it.originalPrice && it.originalPrice > it.price ? `<span class="cart-orig-price">${this.formatRupiah(it.originalPrice)}</span>` : ''}
              <span class="cart-unit-price">${this.formatRupiah(it.price)}</span>
            </div>

            <div class="cart-item-qty-col th-col th-qty">
              <div class="shopee-stepper">
                <button type="button" class="stepper-btn" onclick="PasarinCart.stepQty('${it.productId}', -1)" aria-label="Kurangi kuantitas">-</button>
                <input type="text" class="stepper-val" value="${it.quantity}" readonly>
                <button type="button" class="stepper-btn" onclick="PasarinCart.stepQty('${it.productId}', 1)" aria-label="Tambah kuantitas">+</button>
              </div>
            </div>

            <div class="cart-item-total-col th-col th-total">
              <span class="cart-item-subtotal">${this.formatRupiah(it.price * it.quantity)}</span>
            </div>

            <div class="cart-item-action-col th-col th-action">
              <button type="button" class="btn-delete-row" onclick="PasarinCart.confirmRemoveItem('${it.productId}')">Hapus</button>
              <a href="javascript:void(0)" class="btn-similar-row" onclick="window.location.hash='#/search?q=${encodeURIComponent(it.name.split(' ')[0])}'">Produk Serupa ▾</a>
            </div>
          </div>
        `;
      }).join('');

      const comboHtml = store.comboPromo ? `
        <div class="store-combo-bar">
          <span class="combo-tag">${store.comboPromo.label}</span>
          <span class="combo-text">${store.comboPromo.text}</span>
          <a href="javascript:void(0)" class="combo-link" onclick="if(window.showToast) window.showToast('Promo paket hemat berhasil diaktifkan!', 'success');">${store.comboPromo.action}</a>
        </div>
      ` : '';

      const voucherHtml = store.storeVoucher ? `
        <div class="store-voucher-strip">
          <div class="store-voucher-left">
            <span style="font-size: 15px;">🎟️</span>
            <span>${store.storeVoucher}</span>
          </div>
          <a href="javascript:void(0)" class="store-voucher-link" onclick="if(window.PasarinApp) window.PasarinApp.openPromoModal();">Voucher Lainnya &rsaquo;</a>
        </div>
      ` : '';

      return `
        <div class="cart-store-card">
          <div class="store-card-head">
            <label class="custom-chk-label">
              <input type="checkbox" ${isStoreAllSelected ? 'checked' : ''} onchange="PasarinCart.toggleStoreSelect('${safeStoreName}', this.checked)">
              <span class="custom-chk-box"></span>
            </label>
            <span class="badge-mall-ori"><span class="bg-mall">Mall</span><span class="bg-ori">ORI</span></span>
            <span class="store-name">${store.shopName}</span>
            <button type="button" class="btn-store-chat" onclick="if(window.showToast) window.showToast('Membuka obrolan dengan ${safeStoreName}...', 'info');" title="Chat dengan Penjual">💬</button>
          </div>
          ${comboHtml}
          ${itemsHtml}
          ${voucherHtml}
        </div>
      `;
    }).join('');

    this.updateCartPageStickyBar();
  },

  updateCartPageStickyBar() {
    const selectedItems = this.items.filter(x => x.selected);
    const isAllSelected = this.items.length > 0 && selectedItems.length === this.items.length;
    const selectedCount = selectedItems.length;
    const totalQty = selectedItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
    const grandTotal = selectedItems.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0);

    const headChk = document.getElementById('chk-cart-all-head');
    const footChk = document.getElementById('chk-cart-all-footer');
    if (headChk) headChk.checked = isAllSelected;
    if (footChk) footChk.checked = isAllSelected;

    const countSpan = document.getElementById('cart-selected-count');
    if (countSpan) countSpan.textContent = this.items.length;

    const totalQtySpan = document.getElementById('cart-total-qty');
    if (totalQtySpan) totalQtySpan.textContent = totalQty;

    const totalValEl = document.getElementById('cart-grand-total');
    if (totalValEl) totalValEl.textContent = this.formatRupiah(grandTotal);

    const checkoutBtn = document.getElementById('btn-shopee-checkout');
    if (checkoutBtn) {
      if (selectedCount === 0) {
        checkoutBtn.style.background = '#8cc779';
        checkoutBtn.style.opacity = '0.7';
      } else {
        checkoutBtn.style.background = '#1d3f0d';
        checkoutBtn.style.opacity = '1';
      }
    }
  },

  toggleSelectAll(checked) {
    this.items.forEach(it => { it.selected = checked; });
    this.saveCartState();
    this.renderCartPage();
  },

  toggleStoreSelect(shopName, checked) {
    this.items.forEach(it => {
      if ((it.shopName || '168 Parts Official Store') === shopName) {
        it.selected = checked;
      }
    });
    this.saveCartState();
    this.renderCartPage();
  },

  toggleItemSelect(productId, checked) {
    const it = this.items.find(x => x.productId === productId);
    if (it) {
      it.selected = checked;
    }
    this.saveCartState();
    this.renderCartPage();
  },

  async stepQty(productId, delta) {
    const it = this.items.find(x => x.productId === productId);
    if (!it) return;
    const newQty = (it.quantity || 1) + delta;
    if (newQty <= 0) {
      this.confirmRemoveItem(productId);
      return;
    }
    it.quantity = newQty;
    it.itemTotal = it.price * newQty;
    this.saveCartState();
    this.renderCartPage();
    this.updateCartBadge();
  },

  saveCartState() {
    this.totalQuantity = this.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
    this.subtotal = this.items.reduce((acc, it) => acc + ((it.price || 0) * (it.quantity || 1)), 0);
    try {
      localStorage.setItem('pasarin_local_cart', JSON.stringify(this.items));
    } catch (e) {}
  },

  confirmRemoveSelectedItems() {
    const selected = this.items.filter(x => x.selected);
    if (selected.length === 0) {
      if (window.showToast) window.showToast('Silakan centang minimal satu produk untuk dihapus.', 'warning');
      return;
    }
    this.showConfirmDeleteDialog({
      title: 'Hapus Produk Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selected.length} produk yang dipilih dari keranjang belanja?`,
      onConfirm: () => this.removeSelectedItems()
    });
  },

  async removeSelectedItems() {
    const selected = this.items.filter(x => x.selected);
    const count = selected.length;
    if (count === 0) return;

    const removedIds = selected.map(x => x.productId);
    this.items = this.items.filter(x => !x.selected);
    this.saveCartState();
    this.updateCartBadge();
    this.renderCartPage();
    this.renderCartDrawer();

    if (window.showToast) window.showToast(`${count} produk berhasil dihapus dari keranjang.`, 'success');

    try {
      if (window.PasarinAPI && window.PasarinAPI.removeFromCart) {
        removedIds.forEach(id => {
          window.PasarinAPI.removeFromCart(id).catch(() => {});
        });
      }
    } catch (e) {}
  },

  openDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
      this.renderCartDrawer();
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  renderCartDrawer() {
    const body = document.getElementById('cart-drawer-body');
    const footer = document.getElementById('cart-drawer-footer');
    const countSpan = document.getElementById('cart-drawer-count');
    const totalStrong = document.getElementById('cart-summary-total');

    if (!body) return;

    if (countSpan) countSpan.textContent = this.totalQuantity;
    if (totalStrong) totalStrong.textContent = this.formatRupiah(this.subtotal);

    if (this.items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">
            <svg class="i big"><use href="#cart"/></svg>
          </div>
          <h4>Keranjang Belanja Kosong</h4>
          <p>Yuk cari produk menarik dan promo spesial hari ini!</p>
          <button class="btn-start-shopping" onclick="PasarinCart.closeDrawer()">Mulai Belanja</button>
        </div>
      `;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    body.innerHTML = this.items.map(it => {
      const imgUrl = (it.image && !it.image.includes('unsplash.com')) ? it.image : 'images/product-placeholder.svg';
      const imgHtml = `<img src="${imgUrl}" alt="${it.name}" class="prod-real-img" style="border-radius:6px;" onerror="this.src='images/product-placeholder.svg';">`;
      return `
        <div class="cart-item-card" data-id="${it.productId}">
          <div class="cart-item-pic">
            ${imgHtml}
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-title">${it.name}</h4>
            <div class="cart-item-shop">${it.shopName || '168 Parts Official Store'}</div>
            <div class="cart-item-price">${this.formatRupiah(it.price)}</div>
            <div class="cart-item-controls">
              <div class="qty-stepper">
                <button class="qty-btn" onclick="PasarinCart.updateQuantity('${it.productId}', ${it.quantity - 1})">-</button>
                <input class="qty-input" type="text" value="${it.quantity}" readonly>
                <button class="qty-btn" onclick="PasarinCart.updateQuantity('${it.productId}', ${it.quantity + 1})">+</button>
              </div>
              <button class="btn-remove-item" onclick="PasarinCart.removeItem('${it.productId}')" title="Hapus">
                <svg class="i sm"><use href="#s-help"/></svg> Hapus
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  handleCheckoutClick() {
    const selectedItems = this.items.filter(x => x.selected);
    if (selectedItems.length === 0) {
      if (window.showToast) {
        window.showToast('Silakan pilih minimal 1 produk di keranjang untuk checkout!', 'warning');
      }
      return;
    }

    this.closeDrawer();
    window.location.hash = '#/checkout';
  },

  /* =========================================================
     Shopee Full Checkout Page (#/checkout) Methods
     ========================================================= */
  selectedPaymentMethod: 'Debit Instan',

  selectPaymentMethod(btn, method) {
    this.selectedPaymentMethod = method;
    const container = document.getElementById('pm-pills-list');
    if (container) {
      container.querySelectorAll('.pm-pill').forEach(b => b.classList.remove('selected'));
    }
    if (btn) btn.classList.add('selected');
    if (window.showToast) {
      window.showToast(`Metode pembayaran dipilih: ${method}`, 'info');
    }
  },

  renderCheckoutPage() {
    if (window.PasarinAddressBook) {
      window.PasarinAddressBook.updateCheckoutDisplay();
    } else {
      const user = window.PasarinAuth?.currentUser || {
        name: 'Ferdinand',
        phone: '(+62) 812-3456-7890',
        address: 'Jl. Merdeka No. 45, RT.4/RW.2, Kebon Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11530'
      };

      const recipientEl = document.getElementById('chk-display-recipient');
      const addressEl = document.getElementById('chk-display-address');
      if (recipientEl) {
        let phoneClean = user.phone ? user.phone.trim() : '';
        if (phoneClean && !phoneClean.startsWith('(')) {
          phoneClean = `(${phoneClean})`;
        }
        recipientEl.textContent = `${user.name} ${phoneClean}`;
      }
      if (addressEl) {
        addressEl.textContent = user.address || 'Jl. Merdeka No. 45, RT.4/RW.2, Kebon Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11530';
      }
    }

    let activeItems = this.items.filter(x => x.selected);
    if (activeItems.length === 0) {
      this.items.forEach(it => it.selected = true);
      activeItems = this.items;
    }

    const prodListEl = document.getElementById('checkout-products-list');
    if (prodListEl) {
      prodListEl.innerHTML = activeItems.map(it => {
        const img = (it.image && !it.image.includes('unsplash.com')) ? it.image : 'images/product-placeholder.svg';
        return `
          <div class="chk-prod-row">
            <div class="chk-prod-col th-p-name">
              <img src="${img}" alt="${it.name}" class="chk-thumb" onerror="this.src='images/product-placeholder.svg'">
              <div class="chk-details">
                <div class="chk-p-title">${it.name}</div>
                <div class="chk-p-var">Variasi: ${it.variation || 'Standar'}</div>
              </div>
            </div>
            <div class="chk-prod-col th-p-price">${this.formatRupiah(it.price)}</div>
            <div class="chk-prod-col th-p-qty">${it.quantity || 1}</div>
            <div class="chk-prod-col th-p-sub">${this.formatRupiah(it.price * (it.quantity || 1))}</div>
          </div>
        `;
      }).join('');
    }

    // 1. Perhitungan Subtotal Riil Berdasarkan Produk & Jumlah yang Dibeli
    const subtotalPesanan = activeItems.reduce((acc, it) => {
      const price = Number(it.price) || 0;
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      return acc + (price * qty);
    }, 0);

    // 2. Diskon Produk Riil (Bila ada potongan dari harga asli/original)
    const totalOriginal = activeItems.reduce((acc, it) => {
      const price = Number(it.price) || 0;
      const orig = Number(it.originalPrice) && Number(it.originalPrice) > price ? Number(it.originalPrice) : price;
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      return acc + (orig * qty);
    }, 0);
    const diskonProduk = totalOriginal > subtotalPesanan ? -(totalOriginal - subtotalPesanan) : 0;

    // 3. Subtotal Pengiriman (Gratis ongkir jika subtotal >= 150rb atau voucher ongkir)
    let subtotalPengiriman = subtotalPesanan > 0 ? (subtotalPesanan >= 150000 ? 0 : 5000) : 0;
    if (this.appliedVoucher && (this.appliedVoucher.category === 'ongkir' || this.appliedVoucher.code === 'ONGKIRXTRA')) {
      subtotalPengiriman = 0;
    }

    // 4. Biaya Layanan & Proteksi
    const biayaLayanan = subtotalPesanan > 0 ? 1000 : 0;
    const proteksiProduk = subtotalPesanan > 0 ? 1500 : 0;
    
    // 5. Diskon Voucher / Kode Promo (Dihitung dari subtotalPesanan riil)
    let voucherDiskon = 0;
    if (this.appliedVoucher) {
      if (typeof this.appliedVoucher.discountAmount === 'number' && this.appliedVoucher.discountAmount > 0) {
        voucherDiskon = -Math.min(subtotalPesanan, this.appliedVoucher.discountAmount);
      } else if (this.appliedVoucher.discountValue) {
        if (this.appliedVoucher.discountType === 'percent') {
          const rawDisc = Math.round(subtotalPesanan * (this.appliedVoucher.discountValue / 100));
          const maxDisc = this.appliedVoucher.maxDiscount || rawDisc;
          voucherDiskon = -Math.min(subtotalPesanan, Math.min(rawDisc, maxDisc));
        } else {
          voucherDiskon = -Math.min(subtotalPesanan, this.appliedVoucher.discountValue);
        }
      }
    }

    // 6. Penukaran Koin 168 Parts (1 Poin = Rp1 Tukar Saat Checkout)
    const userPoints = window.PasarinPoints ? window.PasarinPoints.getPoints() : 0;
    const tagihanSebelumKoin = Math.max(0, subtotalPesanan + proteksiProduk + subtotalPengiriman + biayaLayanan + voucherDiskon);
    
    let coinsToUse = 0;
    if (this.useCoins && userPoints > 0) {
      // 1 Poin = Rp1, maksimal sebesar sisa tagihan sebelum koin
      coinsToUse = Math.min(userPoints, tagihanSebelumKoin);
    }
    this.redeemedCoins = coinsToUse;
    const koinDiskon = -coinsToUse;

    // 7. Total Pembayaran Akhir Riil
    const totalPembayaran = Math.max(0, tagihanSebelumKoin + koinDiskon);

    const elSubtotal = document.getElementById('chk-calc-subtotal');
    const elProteksi = document.getElementById('chk-calc-proteksi');
    const elOngkir = document.getElementById('chk-calc-ongkir');
    const elLayanan = document.getElementById('chk-calc-layanan');
    const elDiskonProd = document.getElementById('chk-calc-diskon-produk');
    const elVoucherDiskon = document.getElementById('chk-calc-voucher-diskon');
    const elCoinsRow = document.getElementById('chk-calc-coins-row');
    const elCoinsRedeemed = document.getElementById('chk-calc-coins-redeemed');
    const elEarnedPoints = document.getElementById('chk-calc-earned-points');
    const elCoinBalance = document.getElementById('chk-coin-balance-display');
    const elCoinDiscountVal = document.getElementById('chk-coin-discount-val');
    const elCoinToggle = document.getElementById('chk-use-coins-toggle');
    const elTotal = document.getElementById('chk-calc-total-bayar');

    const earnedPoints = window.PasarinPoints ? window.PasarinPoints.calculatePoints(totalPembayaran) : Math.floor(totalPembayaran / 1000);

    if (elSubtotal) elSubtotal.textContent = this.formatRupiah(subtotalPesanan);
    if (elProteksi) elProteksi.textContent = this.formatRupiah(proteksiProduk);
    if (elOngkir) elOngkir.textContent = this.formatRupiah(subtotalPengiriman);
    if (elLayanan) elLayanan.textContent = this.formatRupiah(biayaLayanan);
    if (elDiskonProd) elDiskonProd.textContent = diskonProduk < 0 ? '-' + this.formatRupiah(Math.abs(diskonProduk)) : 'Rp0';
    if (elVoucherDiskon) elVoucherDiskon.textContent = voucherDiskon < 0 ? '-' + this.formatRupiah(Math.abs(voucherDiskon)) : 'Rp0';
    if (elEarnedPoints) elEarnedPoints.textContent = `+${earnedPoints.toLocaleString('id-ID')} Poin`;
    if (elCoinBalance) elCoinBalance.textContent = userPoints.toLocaleString('id-ID');

    // Update status toggle & nilai diskon koin 168 Parts
    if (elCoinToggle) {
      if (userPoints <= 0) {
        elCoinToggle.disabled = true;
        elCoinToggle.checked = false;
        this.useCoins = false;
      } else {
        elCoinToggle.disabled = false;
        elCoinToggle.checked = this.useCoins;
      }
    }
    if (elCoinDiscountVal) {
      elCoinDiscountVal.textContent = (this.useCoins && coinsToUse > 0)
        ? `[-${this.formatRupiah(coinsToUse)}]`
        : `[-Rp0]`;
      elCoinDiscountVal.style.color = (this.useCoins && coinsToUse > 0) ? '#be123c' : '#94a3b8';
      elCoinDiscountVal.style.fontWeight = (this.useCoins && coinsToUse > 0) ? '700' : 'normal';
    }
    if (elCoinsRow) {
      elCoinsRow.style.display = (this.useCoins && coinsToUse > 0) ? 'flex' : 'none';
    }
    if (elCoinsRedeemed) {
      elCoinsRedeemed.textContent = `-${this.formatRupiah(coinsToUse)}`;
    }

    if (elTotal) elTotal.textContent = this.formatRupiah(totalPembayaran);

    // Update Banner / Tag Voucher Terpasang di Checkout Row
    const elVoucherTag = document.getElementById('chk-applied-voucher-tag');
    const elVoucherBtn = document.getElementById('chk-voucher-btn-select');
    if (this.appliedVoucher) {
      if (elVoucherTag) {
        elVoucherTag.style.display = 'inline-block';
        elVoucherTag.textContent = `[${this.appliedVoucher.code}] -${this.formatRupiah(Math.abs(voucherDiskon))}`;
      }
      if (elVoucherBtn) {
        elVoucherBtn.innerHTML = `Ubah Voucher <span onclick="event.stopPropagation(); PasarinCart.removeVoucher();" style="color:#dc2626; margin-left:6px; cursor:pointer; font-weight:bold;" title="Lepas Voucher">✖</span>`;
      }
    } else {
      if (elVoucherTag) elVoucherTag.style.display = 'none';
      if (elVoucherBtn) elVoucherBtn.textContent = 'Pilih / Masukkan Kode Voucher';
    }

    this.currentCheckoutData = {
      subtotalPesanan,
      proteksiProduk,
      subtotalPengiriman,
      biayaLayanan,
      diskonProduk,
      voucherDiskon,
      koinDiskon,
      redeemedCoins: coinsToUse,
      totalPembayaran,
      earnedPoints,
      items: activeItems
    };
  },

  async applyVoucher(rawCode) {
    if (!rawCode || !rawCode.trim()) return;
    const cleanCode = rawCode.trim().toUpperCase();

    try {
      const activeItems = this.items.filter(x => x.selected);
      const subtotal = activeItems.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Math.max(1, parseInt(it.quantity, 10) || 1))), 0);
      const data = await window.PasarinAPI.validatePromo(cleanCode, subtotal);

      if (data && data.success && data.data) {
        this.appliedVoucher = {
          code: data.data.code,
          title: data.data.title,
          category: data.data.category,
          discountAmount: data.data.discountAmount || 0,
          discountValue: data.data.discountValue,
          discountType: data.data.discountType
        };
        this.renderCheckoutPage();
        if (window.showToast) {
          window.showToast(`🎉 Voucher / Kode Promo "${cleanCode}" berhasil digunakan!`, 'success');
        }
        return true;
      } else {
        if (window.showToast) {
          window.showToast(data ? data.message : `Voucher "${cleanCode}" tidak valid.`, 'error');
        }
        return false;
      }
    } catch (e) {
      console.warn('Gagal validasi via API', e);
      const activeItems = this.items.filter(x => x.selected);
      const subtotal = activeItems.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Math.max(1, parseInt(it.quantity, 10) || 1))), 0);
      const found = (window.PasarinApp?.promos || []).find(p => p.code === cleanCode);
      if (found) {
        const disc = found.discountType === 'percent' ? Math.round(subtotal * ((found.discountValue || 10) / 100)) : (found.discountValue || 10000);
        this.appliedVoucher = {
          code: found.code,
          title: found.title,
          category: found.category,
          discountAmount: disc
        };
        this.renderCheckoutPage();
        if (window.showToast) {
          window.showToast(`🎉 Voucher / Kode Promo "${cleanCode}" berhasil digunakan!`, 'success');
        }
        return true;
      }
      return false;
    }
  },

  removeVoucher() {
    this.appliedVoucher = null;
    this.renderCheckoutPage();
    if (window.showToast) {
      window.showToast('Voucher belanja telah dilepas.', 'info');
    }
  },

  async submitCheckoutOrder() {
    const btn = document.getElementById('btn-buat-pesanan');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Memproses Pesanan...';
    }

    const data = this.currentCheckoutData || { totalPembayaran: 0, subtotalPesanan: 0, voucherDiskon: 0, redeemedCoins: 0 };
    const activeAddr = window.PasarinAddressBook ? window.PasarinAddressBook.getActiveAddress() : null;
    const recipient = document.getElementById('chk-display-recipient')?.textContent || 'Ferdinand';
    const address = document.getElementById('chk-display-address')?.textContent || 'Jakarta Barat';
    const fullShippingInfo = activeAddr ? `${activeAddr.name} (${activeAddr.phone}) - ${activeAddr.address}` : `${recipient} - ${address}`;

    const pointsToRedeem = this.useCoins ? (data.redeemedCoins || 0) : 0;

    const res = await PasarinAPI.checkout({
      shippingAddress: fullShippingInfo,
      paymentMethod: this.selectedPaymentMethod || 'Debit Instan',
      promoCode: this.appliedVoucher ? this.appliedVoucher.code : null,
      discountAmount: Math.abs(data.voucherDiskon || 0),
      redeemedPoints: pointsToRedeem
    });

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Buat Pesanan';
    }

    // 1. Kurangi poin yang ditukarkan untuk pembayaran (1 Poin = Rp1)
    if (pointsToRedeem > 0 && window.PasarinPoints) {
      window.PasarinPoints.deductPoints(pointsToRedeem);
    }

    // 2. Hitung poin yang didapatkan dari sisa pembayaran tunai: 1 poin tiap Rp 1.000
    const earnedPoints = window.PasarinPoints ? window.PasarinPoints.calculatePoints(data.totalPembayaran) : Math.floor(data.totalPembayaran / 1000);
    const newTotalPoints = window.PasarinPoints ? window.PasarinPoints.addPoints(earnedPoints) : earnedPoints;

    // Reset pilihan koin setelah checkout sukses
    const usedCoins = pointsToRedeem;
    this.useCoins = false;
    this.redeemedCoins = 0;

    // Buang item yang dibeli dari keranjang
    const activeItems = this.items.filter(x => x.selected);
    const activeIds = activeItems.map(x => x.productId);
    this.items = this.items.filter(x => !activeIds.includes(x.productId));
    this.saveCartState();
    this.updateCartBadge();

    if (window.showToast) {
      const msg = usedCoins > 0 
        ? `Pesanan berhasil! Menukarkan ${usedCoins.toLocaleString('id-ID')} Poin (Rp${usedCoins.toLocaleString('id-ID')}) & mendapatkan +${earnedPoints} Poin baru!`
        : `Pesanan berhasil! Selamat, Anda mendapatkan +${earnedPoints} Poin Belanja!`;
      window.showToast(msg, 'success');
    }

    this.showOrderSuccessDialog({
      id: res && res.order ? res.order.id : ('ORD-' + Math.floor(100000 + Math.random() * 900000)),
      totalAmount: data.totalPembayaran,
      redeemedPoints: usedCoins,
      earnedPoints,
      newTotalPoints
    });
  },

  openCheckoutModal(selectedItems = null) {
    const user = window.PasarinAuth?.currentUser || {
      name: 'Ferdinand',
      phone: '0812-3456-7890',
      address: 'Jl. Merdeka No. 45, Kebon Jeruk, Jakarta Barat'
    };
    const modalId = 'checkout-modal';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'pasarin-modal-overlay';
      document.body.appendChild(modal);
    }

    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('active');
    };

    const activeItems = (selectedItems && selectedItems.length > 0)
      ? selectedItems
      : (this.items.filter(x => x.selected).length > 0 ? this.items.filter(x => x.selected) : this.items);
    const checkoutSubtotal = activeItems.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0);
    const checkoutQty = activeItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
    const shippingFee = 0; // Gratis ongkir promo
    let grandTotal = checkoutSubtotal + shippingFee;

    modal.innerHTML = `
      <div class="pasarin-modal-card checkout-modal-card">
        <div class="pasarin-modal-header checkout-modal-header">
          <div>
            <h3 class="checkout-header-title">Konfirmasi Pembayaran & Checkout</h3>
            <small class="checkout-header-subtitle">Periksa rincian pesanan dan selesaikan transaksi dengan aman</small>
          </div>
          <button class="pasarin-modal-close" onclick="document.getElementById('${modalId}').classList.remove('active')" aria-label="Tutup">&times;</button>
        </div>

        <div class="pasarin-modal-body checkout-modal-body">
          <!-- 1. Alamat Pengiriman -->
          <div class="checkout-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 class="checkout-title" style="margin: 0;">
                <span class="checkout-title-icon">📍</span>
                <span>Alamat Pengiriman</span>
              </h4>
              <button type="button" class="btn-open-gmaps" onclick="PasarinCart.openCheckoutGmaps()">
                <span>📍</span> Pilih Lewat Peta (GMaps)
              </button>
            </div>
            <div class="checkout-address-card">
              <div class="checkout-recipient-info">
                <span class="recipient-name">${user.name}</span>
                <span class="recipient-phone">${user.phone || '0812-3456-7890'}</span>
                <span class="address-type-badge">Utama</span>
              </div>
              <textarea id="checkout-address" class="checkout-address-textarea" rows="2" placeholder="Tuliskan detail jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota...">${user.address || 'Jl. Merdeka No. 45, Kebon Jeruk, Jakarta Barat'}</textarea>
            </div>
          </div>

          <!-- 2. Metode Pembayaran -->
          <div class="checkout-section">
            <h4 class="checkout-title">
              <span class="checkout-title-icon">💳</span>
              <span>Metode Pembayaran</span>
            </h4>
            <div class="payment-options-grid">
              <label class="payment-option selected">
                <input type="radio" name="payment_method" value="GoPay" checked>
                <div class="payment-option-inner">
                  <div class="payment-icon-wrap" style="background: #e0f2fe; color: #0284c7;">📱</div>
                  <div class="payment-info">
                    <span class="payment-name">GoPay / QRIS</span>
                    <small class="payment-desc">Instan & Bebas Biaya Layanan</small>
                  </div>
                  <span class="payment-check-dot"></span>
                </div>
              </label>

              <label class="payment-option">
                <input type="radio" name="payment_method" value="DANA">
                <div class="payment-option-inner">
                  <div class="payment-icon-wrap" style="background: #ede9fe; color: #7c3aed;">💰</div>
                  <div class="payment-info">
                    <span class="payment-name">DANA Dompet Digital</span>
                    <small class="payment-desc">Saldo atau Debit DANA</small>
                  </div>
                  <span class="payment-check-dot"></span>
                </div>
              </label>

              <label class="payment-option">
                <input type="radio" name="payment_method" value="BCA Virtual Account">
                <div class="payment-option-inner">
                  <div class="payment-icon-wrap" style="background: #e0e7ff; color: #3730a3;">🏦</div>
                  <div class="payment-info">
                    <span class="payment-name">BCA Virtual Account</span>
                    <small class="payment-desc">Verifikasi otomatis 24 jam</small>
                  </div>
                  <span class="payment-check-dot"></span>
                </div>
              </label>

              <label class="payment-option">
                <input type="radio" name="payment_method" value="COD">
                <div class="payment-option-inner">
                  <div class="payment-icon-wrap" style="background: #fef3c7; color: #d97706;">📦</div>
                  <div class="payment-info">
                    <span class="payment-name">COD (Bayar di Tempat)</span>
                    <small class="payment-desc">Bayar tunai saat kurir tiba</small>
                  </div>
                  <span class="payment-check-dot"></span>
                </div>
              </label>
            </div>
          </div>

          <!-- 3. Voucher & Kode Promo -->
          <div class="checkout-section">
            <div class="checkout-title-row">
              <h4 class="checkout-title" style="margin: 0;">
                <span class="checkout-title-icon">🏷️</span>
                <span>Kode Promo / Voucher Belanja</span>
              </h4>
              <span class="checkout-title-hint">Punya kode promo? Terapkan di sini</span>
            </div>
            <div class="checkout-promo-input-row">
              <input type="text" id="checkout-promo-input" class="checkout-promo-input-field" placeholder="Ketik kode promo (contoh: 168PARTSBARU)...">
              <button type="button" class="btn-checkout-apply-promo" id="btn-apply-checkout-promo">
                Terapkan
              </button>
            </div>
            <div id="checkout-promo-feedback" class="checkout-promo-feedback-box" style="display: none;"></div>

            <!-- Rekomendasi Kode Promo Cepat -->
            <div class="checkout-quick-promo-wrap">
              <div class="quick-promo-label">Pilih promo cepat:</div>
              <div id="checkout-quick-promo-chips" class="quick-promo-chips-list">
                <span class="ticket-code-pill" onclick="PasarinCart.fillCheckoutPromo('PASARINBARU')">🎁 PASARINBARU</span>
                <span class="ticket-code-pill" onclick="PasarinCart.fillCheckoutPromo('ONGKIRXTRA')">🚚 ONGKIRXTRA</span>
                <span class="ticket-code-pill" onclick="PasarinCart.fillCheckoutPromo('FLASHSALE80')">⚡ FLASHSALE80</span>
                <span class="ticket-code-pill" onclick="PasarinCart.fillCheckoutPromo('CASHBACK50')">💰 CASHBACK50</span>
                <span class="ticket-code-pill" onclick="PasarinCart.fillCheckoutPromo('PILIHLOKAL')">🇮🇩 PILIHLOKAL</span>
                <span class="ticket-code-pill" onclick="PasarinCart.fillCheckoutPromo('GAJIANHEMAT')">🛍️ GAJIANHEMAT</span>
              </div>
            </div>
          </div>

          <!-- 4. Ringkasan Pesanan -->
          <div class="checkout-section">
            <h4 class="checkout-title">
              <span class="checkout-title-icon">📋</span>
              <span>Ringkasan Pembayaran (${checkoutQty} Produk)</span>
            </h4>
            <div class="checkout-summary-box">
              <div class="summary-line">
                <span>Subtotal Produk</span>
                <span class="summary-val">${this.formatRupiah(checkoutSubtotal)}</span>
              </div>
              <div class="summary-line text-success">
                <span>Biaya Pengiriman</span>
                <span class="summary-val" style="color: #059669; font-weight: 700;">GRATIS (Ongkir Xtra)</span>
              </div>
              <div class="summary-line text-success" id="checkout-discount-row" style="display: none;">
                <span id="checkout-discount-label">Diskon Promo</span>
                <span class="summary-val" id="checkout-discount-val" style="color: #059669; font-weight: 800;">-Rp0</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-line total-line">
                <div>
                  <strong>Total Pembayaran</strong>
                  <div style="font-size: 11px; color: #64748b; font-weight: normal;">Termasuk pajak & proteksi pembeli</div>
                </div>
                <strong class="grand-total-price" id="checkout-grand-total">${this.formatRupiah(grandTotal)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="pasarin-modal-footer checkout-modal-footer">
          <button class="btn-checkout-cancel" onclick="document.getElementById('${modalId}').classList.remove('active')">Batal</button>
          <button class="btn-checkout-submit" id="btn-submit-order">
            <span>🛡️ Bayar & Proses Pesanan</span>
          </button>
        </div>
      </div>
    `;

    modal.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        modal.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    let currentDiscount = 0;
    let appliedPromoCode = null;

    const promoInput = modal.querySelector('#checkout-promo-input');
    const applyBtn = modal.querySelector('#btn-apply-checkout-promo');
    const promoFeedback = modal.querySelector('#checkout-promo-feedback');
    const discountRow = modal.querySelector('#checkout-discount-row');
    const discountLabel = modal.querySelector('#checkout-discount-label');
    const discountVal = modal.querySelector('#checkout-discount-val');
    const grandTotalEl = modal.querySelector('#checkout-grand-total');

    const updateTotals = () => {
      const finalAmount = Math.max(0, grandTotal - currentDiscount);
      if (grandTotalEl) grandTotalEl.textContent = this.formatRupiah(finalAmount);
    };

    const applyPromo = async (code) => {
      if (!code || !code.trim()) {
        if (promoFeedback) {
          promoFeedback.style.display = 'block';
          promoFeedback.style.color = '#ef4444';
          promoFeedback.textContent = 'Silakan ketik kode promo terlebih dahulu.';
        }
        return;
      }

      applyBtn.disabled = true;
      applyBtn.textContent = 'Cek...';

      const res = await PasarinAPI.validatePromo(code.trim().toUpperCase(), this.subtotal);
      applyBtn.disabled = false;

      if (res && res.success && res.data) {
        currentDiscount = res.data.discountAmount;
        appliedPromoCode = res.data.code;

        if (promoFeedback) {
          promoFeedback.style.display = 'block';
          promoFeedback.style.color = '#059669';
          promoFeedback.innerHTML = `✓ Kode <strong>"${res.data.code}"</strong> aktif! Hemat ${this.formatRupiah(currentDiscount)}`;
        }

        if (discountRow) discountRow.style.display = 'flex';
        if (discountLabel) discountLabel.textContent = `Diskon (${res.data.code})`;
        if (discountVal) discountVal.textContent = '-' + this.formatRupiah(currentDiscount);

        promoInput.disabled = true;
        applyBtn.textContent = 'Hapus';
        applyBtn.style.background = '#64748b';

        updateTotals();
        if (window.showToast) window.showToast(res.message, 'success');
      } else {
        currentDiscount = 0;
        appliedPromoCode = null;

        if (promoFeedback) {
          promoFeedback.style.display = 'block';
          promoFeedback.style.color = '#ef4444';
          promoFeedback.textContent = res ? res.message : 'Kode promo tidak valid atau tidak dapat digunakan.';
        }

        if (discountRow) discountRow.style.display = 'none';
        applyBtn.textContent = 'Terapkan';
        applyBtn.style.background = '';
        updateTotals();
      }
    };

    const removePromo = () => {
      currentDiscount = 0;
      appliedPromoCode = null;
      promoInput.disabled = false;
      promoInput.value = '';
      applyBtn.textContent = 'Terapkan';
      applyBtn.style.background = '';
      if (promoFeedback) promoFeedback.style.display = 'none';
      if (discountRow) discountRow.style.display = 'none';
      updateTotals();
      if (window.showToast) window.showToast('Kode promo dihapus.', 'info');
    };

    if (applyBtn) {
      applyBtn.onclick = () => {
        if (appliedPromoCode) {
          removePromo();
        } else {
          applyPromo(promoInput.value);
        }
      };
    }

    if (promoInput) {
      promoInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!appliedPromoCode) applyPromo(promoInput.value);
        }
      };
    }

    // Expose quick fill helper
    PasarinCart.fillCheckoutPromo = (code) => {
      if (promoInput && !appliedPromoCode) {
        promoInput.value = code;
        applyPromo(code);
      }
    };

    const submitBtn = modal.querySelector('#btn-submit-order');
    submitBtn.onclick = async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses...';

      const address = modal.querySelector('#checkout-address').value;
      const paymentMethod = modal.querySelector('input[name="payment_method"]:checked')?.value || 'GoPay';

      const res = await PasarinAPI.checkout({
        shippingAddress: address,
        paymentMethod
      });

      if (res && res.success) {
        modal.classList.remove('active');
        const checkedOutIds = activeItems.map(x => x.productId);
        this.items = this.items.filter(x => !checkedOutIds.includes(x.productId));
        this.saveCartState();
        this.updateCartBadge();
        this.renderCartPage();

        const finalTotal = Math.max(0, grandTotal - currentDiscount);
        const earnedPoints = window.PasarinPoints ? window.PasarinPoints.calculatePoints(finalTotal) : Math.floor(finalTotal / 1000);
        const newTotalPoints = window.PasarinPoints ? window.PasarinPoints.addPoints(earnedPoints) : earnedPoints;

        if (window.showToast) {
          window.showToast(`Pesanan berhasil! Selamat, Anda mendapatkan +${earnedPoints} Poin Belanja!`, 'success');
        }
        this.showOrderSuccessDialog(res.order ? { ...res.order, earnedPoints, newTotalPoints } : { id: 'ORD-' + Math.floor(Math.random()*100000), totalAmount: finalTotal, earnedPoints, newTotalPoints });
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bayar & Proses Pesanan Sekarang';
        if (window.showToast) {
          window.showToast(res ? res.message : 'Gagal membuat pesanan.', 'error');
        }
      }
    };

    modal.classList.add('active');
  },

  showOrderSuccessDialog(order) {
    const dialogId = 'order-success-modal';
    let dialog = document.getElementById(dialogId);
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = dialogId;
      dialog.className = 'pasarin-modal-overlay';
      document.body.appendChild(dialog);
    }

    const earned = (order && order.earnedPoints != null) 
      ? order.earnedPoints 
      : (window.PasarinPoints ? window.PasarinPoints.calculatePoints(order?.totalAmount) : Math.floor((order?.totalAmount || 0) / 1000));
    const totalUserPoints = (order && order.newTotalPoints != null)
      ? order.newTotalPoints
      : (window.PasarinPoints ? window.PasarinPoints.getPoints() : earned);

    dialog.innerHTML = `
      <div class="pasarin-modal-card text-center" style="max-width: 440px; padding: 28px 24px; border-radius: 18px; text-align: center;">
        <div style="width: 68px; height: 68px; background: #ecfdf5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin: 0 auto 16px auto; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.2);">✓</div>
        <h3 style="margin-bottom: 6px; font-size: 18px; font-weight: 800; color: #0f172a;">Pesanan Berhasil Dibuat!</h3>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
          Terima kasih telah berbelanja di 168 Parts Surabaya. Pesanan Anda telah terverifikasi dan langsung diproses penjual.
        </p>

        <!-- Reward Poin Checkout Card (1 Poin tiap Rp1.000) -->
        <div class="checkout-reward-point-card" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1.5px solid #f59e0b; border-radius: 14px; padding: 13px 15px; margin-bottom: 16px; text-align: left; display: flex; align-items: center; gap: 12px; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.15);">
          <div style="width: 44px; height: 44px; background: #fbbf24; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);">🪙</div>
          <div style="flex: 1;">
            <div style="font-size: 11px; text-transform: uppercase; color: #92400e; font-weight: 800; letter-spacing: 0.5px;">Checkout Reward Poin</div>
            <div style="font-size: 17px; font-weight: 800; color: #b45309;">+${earned.toLocaleString('id-ID')} Poin Didapatkan!</div>
            <div style="font-size: 11.5px; color: #78350f; margin-top: 2px;">
              Dihitung 1 Poin per Rp1.000 belanja • Saldo: <b>${totalUserPoints.toLocaleString('id-ID')} Poin</b>
            </div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">No. Pesanan:</span>
            <strong style="font-family: monospace; color: #0f172a;">${order.id}</strong>
          </div>
          ${order.redeemedPoints > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #be123c;">
            <span>Potongan Koin 168 (1 Poin = Rp1):</span>
            <strong>-${this.formatRupiah(order.redeemedPoints)} (${order.redeemedPoints.toLocaleString('id-ID')} Poin)</strong>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Total Tagihan:</span>
            <strong style="color: var(--primary); font-size: 15px;">${this.formatRupiah(order.totalAmount)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b;">Status:</span>
            <span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">Sedang Diproses</span>
          </div>
        </div>
        <button class="btn-checkout-submit" style="width: 100%; justify-content: center;" onclick="document.getElementById('${dialogId}').classList.remove('active'); if (window.PasarinApp) window.PasarinApp.openOrdersModal();">
          Lihat Riwayat Pesanan Saya
        </button>
      </div>
    `;

    dialog.classList.add('active');
  },

  /* GMaps Picker / Address Selector di Checkout */
  openCheckoutGmaps() {
    if (window.PasarinAddressBook) {
      window.PasarinAddressBook.openModal();
      return;
    }
    if (window.PasarinGmapsPicker) {
      const addrDisplay = document.getElementById('chk-display-address');
      const addrField = document.getElementById('checkout-address');
      const currentAddr = addrDisplay ? addrDisplay.textContent.trim() : (addrField ? addrField.value : '');
      window.PasarinGmapsPicker.open({
        initialAddress: currentAddr,
        onConfirm: (fullAddress) => {
          if (addrDisplay) addrDisplay.textContent = fullAddress;
          if (addrField) addrField.value = fullAddress;
        }
      });
    }
  }
};

window.PasarinCart = PasarinCart;
