import { Product, Promo, BannerConfig, Order } from './types';
import { fallbackProducts, fallbackBanners, fallbackPromos } from './fallbackData';

const API_BASE = (() => {
  if (typeof window === 'undefined') return '/api';
  const { protocol, hostname, port } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (protocol === 'file:' || (isLocal && port !== '3000')) {
    return 'http://localhost:3000/api';
  }
  return '/api';
})();

export async function fetchProducts(query = ''): Promise<Product[]> {
  try {
    const url = query ? `${API_BASE}/products${query}` : `${API_BASE}/products`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
    return fallbackProducts;
  } catch (err) {
    console.warn('[API] fetchProducts fallback to local 168 Parts products:', err);
    return fallbackProducts;
  }
}

export async function createProduct(payload: Partial<Product>, token?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function updateProduct(id: string, payload: Partial<Product>, token?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function deleteProduct(id: string, token?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return await res.json();
}

export async function importShopeeProducts(payload: any, token?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/products/import-shopee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function fetchBanners(): Promise<BannerConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/banners`);
    const data = await res.json();
    return data.success && data.data ? data.data : fallbackBanners;
  } catch (e) {
    return fallbackBanners;
  }
}

export async function updateBanners(banners: BannerConfig): Promise<any> {
  const res = await fetch(`${API_BASE}/banners`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(banners)
  });
  return await res.json();
}

export async function resetBanners(): Promise<any> {
  const res = await fetch(`${API_BASE}/banners/reset`, { method: 'POST' });
  return await res.json();
}

export async function fetchActivePromos(): Promise<Promo[]> {
  try {
    const res = await fetch(`${API_BASE}/promos`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
    return fallbackPromos;
  } catch (e) {
    return fallbackPromos;
  }
}

export async function fetchAllPromos(): Promise<Promo[]> {
  try {
    const res = await fetch(`${API_BASE}/promos/all`);
    const data = await res.json();
    return data.success && data.data ? data.data : [];
  } catch (e) {
    return [];
  }
}

export async function validatePromo(code: string, amount: number): Promise<any> {
  const res = await fetch(`${API_BASE}/promos/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, totalAmount: amount })
  });
  return await res.json();
}

export async function createPromo(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/promos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function updatePromo(code: string, payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/promos/${code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function togglePromoStatus(code: string, isActive: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/promos/${code}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive })
  });
  return await res.json();
}

export async function deletePromo(code: string): Promise<any> {
  const res = await fetch(`${API_BASE}/promos/${code}`, {
    method: 'DELETE'
  });
  return await res.json();
}

export async function fetchAllOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE}/orders/all`);
    const data = await res.json();
    return data.success && data.data ? data.data : [];
  } catch (e) {
    return [];
  }
}

export async function updateOrderStatus(id: string, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return await res.json();
}

export function formatRupiah(num: number): string {
  return 'Rp' + Number(num || 0).toLocaleString('id-ID');
}

