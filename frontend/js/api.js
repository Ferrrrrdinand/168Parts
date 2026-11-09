/* =========================================================
   Pasarin Indonesia - API Client Helper
   Mendukung koneksi ke REST API backend dengan
   graceful offline fallback (tetap jalan meski tanpa server).
   ========================================================= */

// Gunakan origin saat aplikasi dilayani backend; pada development lokal yang
// memakai server statis, arahkan request ke backend lokal.
const API_BASE = (() => {
  if (typeof window === 'undefined') return '/api';

  const { protocol, hostname, port } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (protocol === 'file:' || (isLocal && port !== '3000')) {
    return 'http://localhost:3000/api';
  }
  return '/api';
})();

const PasarinAPI = {
  baseUrl: API_BASE,

  getToken() {
    return localStorage.getItem('pasarin_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('pasarin_token', token);
    } else {
      localStorage.removeItem('pasarin_token');
    }
  },

  getSessionId() {
    let sid = localStorage.getItem('pasarin_session_id');
    if (!sid) {
      sid = 'guest-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('pasarin_session_id', sid);
    }
    return sid;
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'x-session-id': this.getSessionId(),
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const cType = res.headers.get('content-type') || '';
      if (cType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
      const rawText = await res.text();
      return { success: false, status: res.status, message: `Respon non-JSON (${res.status}): ${rawText.slice(0, 100)}` };
    } catch (err) {
      console.warn(`[PasarinAPI] Gagal menghubungi backend di ${endpoint}:`, err.message);
      return { success: false, offline: true, message: 'Server backend tidak terhubung. Menggunakan mode lokal.' };
    }
  },

  // Auth Endpoints
  async register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async login(payload) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getMe() {
    return this.request('/auth/me', { method: 'GET' });
  },

  async updateProfile(payload) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async logout() {
    this.setToken(null);
    return this.request('/auth/logout', { method: 'POST' });
  },

  // Products Endpoints
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        query.append(k, params[k]);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/products${qs}`);
  },

  async getProductById(id) {
    return this.request(`/products/${id}`);
  },

  // CRUD Produk (MySQL)
  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  async getCategories() {
    return this.request('/products/categories');
  },

  async getFlashSale() {
    return this.request('/products/flash-sale');
  },

  // Promo Code Endpoints
  async getPromos() {
    return this.request('/promos');
  },

  async claimPromo(code) {
    return this.request(`/promos/${encodeURIComponent(code)}/claim`, {
      method: 'POST'
    });
  },

  async getMyVouchers() {
    return this.request('/promos/my-vouchers');
  },

  async validatePromo(code, subtotal) {
    return this.request('/promos/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  },

  async createPromo(promoData) {
    return this.request('/promos', {
      method: 'POST',
      body: JSON.stringify(promoData)
    });
  },

  async deletePromo(code) {
    return this.request(`/promos/${encodeURIComponent(code)}`, {
      method: 'DELETE'
    });
  },

  // Cart Endpoints
  async getCart() {
    return this.request('/cart');
  },

  async addToCart(productId, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  },

  async updateCartItem(productId, quantity) {
    return this.request(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  },

  async removeFromCart(productId) {
    return this.request(`/cart/${productId}`, {
      method: 'DELETE'
    });
  },

  async clearCart() {
    return this.request('/cart', {
      method: 'DELETE'
    });
  },

  // Orders Endpoints
  async checkout(payload) {
    return this.request('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getMyOrders() {
    return this.request('/orders');
  }
};

window.PasarinAPI = PasarinAPI;
