const dbManager = require('../config/database');
const { Product } = require('./index');

class ProductModel {
  // Helper memformat baris database menjadi objek produk frontend yang rapi
  formatProductRow(row) {
    if (!row) return null;
    let specs = [];
    if (row.specs) {
      try {
        specs = typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs;
      } catch (e) {
        specs = [];
      }
    }

    let variants = [];
    if (row.variants) {
      try {
        variants = typeof row.variants === 'string' ? JSON.parse(row.variants) : row.variants;
      } catch (e) {
        variants = [];
      }
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : null,
      discountPercent: Number(row.discount_percent || 0),
      rating: Number(row.rating || 5.0),
      soldCount: Number(row.sold_count || 0),
      stock: Number(row.stock || 0),
      location: row.location || 'Indonesia',
      shopName: row.shop_name || 'Pasarin Store',
      shopType: row.shop_type || 'Star',
      icon: row.icon || 'bag',
      image: row.image || null,
      bgPattern: row.bg_pattern || '#f8fafc',
      isFlashSale: Boolean(row.is_flash_sale),
      flashSaleSold: Number(row.flash_sale_sold || 0),
      description: row.description || '',
      specs: specs,
      variants: variants,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // CREATE: Tambah Produk Baru ke Database Lokal (CRUD - C)
  async create(data) {
    const id = data.id || 'prod-' + Date.now();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const price = Number(data.price) || 0;
    const originalPrice = data.originalPrice ? Number(data.originalPrice) : (price * 1.25);
    const discountPercent = data.discountPercent !== undefined ? Number(data.discountPercent) : Math.round(((originalPrice - price) / originalPrice) * 100);

    const productPayload = {
      id,
      name: data.name.trim(),
      slug,
      category: data.category || 'Elektronik',
      price,
      originalPrice,
      discountPercent: Math.max(0, discountPercent),
      rating: Number(data.rating || 5.0),
      soldCount: Number(data.soldCount || 0),
      stock: Number(data.stock || 20),
      location: data.location || 'Jakarta Barat',
      shopName: data.shopName || 'Pasarin Partner',
      shopType: data.shopType || 'Star+',
      icon: data.icon || 'bag',
      image: data.image || 'images/product-placeholder.svg',
      bgPattern: data.bgPattern || '#f8fafc',
      isFlashSale: Boolean(data.isFlashSale),
      flashSaleSold: Number(data.flashSaleSold || 0),
      description: data.description || '',
      specs: Array.isArray(data.specs) ? data.specs : (typeof data.specs === 'string' ? data.specs.split('\n').filter(Boolean) : [])
    };

    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      const rowPayload = {
        id: productPayload.id,
        name: productPayload.name,
        slug: productPayload.slug,
        category: productPayload.category,
        price: productPayload.price,
        original_price: productPayload.originalPrice,
        discount_percent: productPayload.discountPercent,
        rating: productPayload.rating,
        sold_count: productPayload.soldCount,
        stock: productPayload.stock,
        location: productPayload.location,
        shop_name: productPayload.shopName,
        shop_type: productPayload.shopType,
        icon: productPayload.icon,
        image: productPayload.image,
        bg_pattern: productPayload.bgPattern,
        is_flash_sale: productPayload.isFlashSale,
        flash_sale_sold: productPayload.flashSaleSold,
        description: productPayload.description,
        specs: productPayload.specs
      };
      await dbManager.supabaseClient.from('products').insert([rowPayload]);
    } else if (dbManager.isConnected) {
      const sql = `
        INSERT INTO products (
          id, name, slug, category, price, original_price, discount_percent,
          rating, sold_count, stock, location, shop_name, shop_type,
          icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await dbManager.query(sql, [
        productPayload.id,
        productPayload.name,
        productPayload.slug,
        productPayload.category,
        productPayload.price,
        productPayload.originalPrice,
        productPayload.discountPercent,
        productPayload.rating,
        productPayload.soldCount,
        productPayload.stock,
        productPayload.location,
        productPayload.shopName,
        productPayload.shopType,
        productPayload.icon,
        productPayload.image,
        productPayload.bgPattern,
        Boolean(productPayload.isFlashSale),
        productPayload.flashSaleSold,
        productPayload.description,
        JSON.stringify(productPayload.specs)
      ]);
    }

    return productPayload;
  }

  // READ ALL: Mengambil Semua Produk dari Database Cloud PostgreSQL
  async findAll(filter = {}) {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (filter.q && filter.q.trim()) {
      const kw = `%${filter.q.trim()}%`;
      sql += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR shop_name LIKE ?)';
      params.push(kw, kw, kw, kw);
    }

    if (filter.category && filter.category !== 'Semua') {
      sql += ' AND category = ?';
      params.push(filter.category);
    }

    if (filter.minPrice) {
      sql += ' AND price >= ?';
      params.push(Number(filter.minPrice));
    }

    if (filter.maxPrice) {
      sql += ' AND price <= ?';
      params.push(Number(filter.maxPrice));
    }

    if (filter.rating) {
      sql += ' AND rating >= ?';
      params.push(Number(filter.rating));
    }

    if (filter.location) {
      sql += ' AND location LIKE ?';
      params.push(`%${filter.location}%`);
    }

    if (filter.shopType) {
      sql += ' AND shop_type = ?';
      params.push(filter.shopType);
    }

    // Pengurutan
    if (filter.sort === 'price_asc') {
      sql += ' ORDER BY price ASC';
    } else if (filter.sort === 'price_desc') {
      sql += ' ORDER BY price DESC';
    } else if (filter.sort === 'top_sales') {
      sql += ' ORDER BY sold_count DESC';
    } else if (filter.sort === 'rating') {
      sql += ' ORDER BY rating DESC';
    } else if (filter.sort === 'latest') {
      sql += ' ORDER BY created_at DESC';
    } else {
      sql += ' ORDER BY is_flash_sale DESC, id ASC';
    }

    if (filter.limit) {
      const limit = parseInt(filter.limit, 10);
      const offset = parseInt(filter.offset, 10) || 0;
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const rows = await dbManager.query(sql, params);
    return (rows || []).map(r => this.formatProductRow(r));
  }

  // READ ONE: Mengambil 1 Produk Berdasarkan ID
  async findById(id) {
    const rows = await dbManager.query('SELECT * FROM products WHERE id = ? OR slug = ? LIMIT 1', [id, id]);
    if (rows && rows.length > 0) {
      return this.formatProductRow(rows[0]);
    }
    return null;
  }

  // UPDATE: Memperbarui Produk di Database Lokal (CRUD - U)
  async update(id, updateData) {
    let existing = await this.findById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updateData,
      price: updateData.price !== undefined ? Number(updateData.price) : existing.price,
      originalPrice: updateData.originalPrice !== undefined ? Number(updateData.originalPrice) : existing.originalPrice,
      stock: updateData.stock !== undefined ? Number(updateData.stock) : existing.stock,
      discountPercent: updateData.discountPercent !== undefined ? Number(updateData.discountPercent) : existing.discountPercent,
      isFlashSale: updateData.isFlashSale !== undefined ? Boolean(updateData.isFlashSale) : existing.isFlashSale
    };

    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      try {
        const updatePayload = {
          name: merged.name,
          category: merged.category,
          price: merged.price,
          original_price: merged.originalPrice,
          discount_percent: merged.discountPercent,
          stock: merged.stock,
          location: merged.location,
          shop_name: merged.shopName,
          shop_type: merged.shopType,
          image: merged.image,
          is_flash_sale: merged.isFlashSale,
          description: merged.description,
          specs: merged.specs,
          updated_at: new Date().toISOString()
        };
        await dbManager.supabaseClient.from('products').update(updatePayload).eq('id', id);
      } catch (err) {
        console.warn('⚠️ Supabase update error:', err.message);
      }
    } else if (dbManager.isConnected) {
      const sql = `
        UPDATE products SET
          name = ?, category = ?, price = ?, original_price = ?, discount_percent = ?,
          stock = ?, location = ?, shop_name = ?, shop_type = ?, image = ?,
          is_flash_sale = ?, description = ?, specs = ?
        WHERE id = ?
      `;
      await dbManager.query(sql, [
        merged.name,
        merged.category,
        merged.price,
        merged.originalPrice,
        merged.discountPercent,
        merged.stock,
        merged.location,
        merged.shopName,
        merged.shopType,
        merged.image,
        Boolean(merged.isFlashSale),
        merged.description,
        JSON.stringify(merged.specs || []),
        id
      ]);
    }

    return merged;
  }

  // DELETE: Menghapus Produk dari Database Lokal (CRUD - D)
  async delete(id) {
    let deleted = false;
    const res = await dbManager.query('DELETE FROM products WHERE id = ?', [id]);
    if (res && res[0] && res[0].affectedRows > 0) deleted = true;
    return deleted;
  }

  // Helper: Waktu siklus Flash Sale (Mendukung Reset Tengah Malam Otomatis maupun Manual Reset oleh Admin)
  getFlashSaleTiming() {
    const now = new Date();
    let secondsSinceStart = 0;
    let nextResetMs = 0;
    let isManualCycle = false;

    // Jika admin melakukan manual reset dalam 24 jam terakhir
    if (this._manualResetTimestamp && (now.getTime() - this._manualResetTimestamp) < 86400000) {
      isManualCycle = true;
      secondsSinceStart = Math.floor((now.getTime() - this._manualResetTimestamp) / 1000);
      nextResetMs = this._manualResetTimestamp + 86400000;
    } else {
      // Siklus reguler 24 jam berbasis tengah malam WIB (UTC+7)
      const nowUtcMs = now.getTime();
      const wibOffsetMs = 7 * 3600 * 1000;
      const nowWib = new Date(nowUtcMs + wibOffsetMs);
      const nextMidnightWib = new Date(Date.UTC(
        nowWib.getUTCFullYear(),
        nowWib.getUTCMonth(),
        nowWib.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      nextResetMs = nextMidnightWib.getTime() - wibOffsetMs;

      const utcHours = now.getUTCHours();
      const utcMinutes = now.getUTCMinutes();
      const utcSeconds = now.getUTCSeconds();
      const wibHours = (utcHours + 7) % 24;
      secondsSinceStart = (wibHours * 3600) + (utcMinutes * 60) + utcSeconds;
    }

    const secondsRemaining = Math.max(0, Math.floor((nextResetMs - now.getTime()) / 1000));
    const dayProgress = Math.min(1.0, Math.max(0.0, secondsSinceStart / 86400));

    return {
      nowMs: now.getTime(),
      nextResetMs,
      secondsRemaining,
      dayProgress,
      isManualCycle,
      resetSchedule: isManualCycle ? 'Siklus 24 Jam Manual (Admin Reset)' : 'Setiap hari pukul 00:00 WIB (Tengah Malam)'
    };
  }

  // FLASH SALE (Siklus 24 Jam - Reset Otomatis Setiap Pukul 00:00:00 Tengah Malam WIB)
  async findFlashSale() {
    try {
      const timing = this.getFlashSaleTiming();

      // 1. Ambil produk yang ditandai Flash Sale (Prioritas ID 168-p1 LanRui I9)
      let rows = await dbManager.query('SELECT * FROM products WHERE is_flash_sale = true LIMIT 18');

      // Jika belum ada / kurang dari 4 produk yang di-flag, ambil produk terlaris
      if (!rows || rows.length < 4) {
        rows = await dbManager.query('SELECT * FROM products ORDER BY sold_count DESC LIMIT 12');
      }

      return (rows || []).map((r, idx) => {
        const p = this.formatProductRow(r);

        const basePercent = 16 + ((idx * 7) % 12);
        const dynamicPercent = Math.min(96, Math.max(15, Math.round(basePercent + (timing.dayProgress * (92 - basePercent)))));

        p.isFlashSale = true;
        p.flashSaleSold = dynamicPercent;
        p.flashSaleSoldUnits = Math.max(5, Math.round((p.stock || 50) * (dynamicPercent / 100)));
        return p;
      });
    } catch (err) {
      console.warn('findFlashSale database query fallback:', err.message);
      try {
        const seedProducts = require('../../data/seedProducts');
        const list = seedProducts.filter(p => p.isFlashSale).slice(0, 12);
        return (list.length > 0 ? list : seedProducts.slice(0, 12)).map(p => ({
          ...p,
          flashSaleSold: 75,
          flashSaleSoldUnits: Math.max(5, Math.round((p.stock || 50) * 0.75))
        }));
      } catch (e2) {
        return [];
      }
    }
  }

  // Reset siklus Flash Sale secara manual oleh Admin (Countdown & kuota kembali ke 0 detik ini juga)
  async resetFlashSaleCycle() {
    this._manualResetTimestamp = Date.now();
    return {
      success: true,
      resetAt: new Date(this._manualResetTimestamp).toISOString(),
      timing: this.getFlashSaleTiming()
    };
  }

  // Pilihkan otomatis 12 produk terlaris menjadi Flash Sale
  async autoSelectFlashSale(limit = 12) {
    if (dbManager.isConnected) {
      await dbManager.query('UPDATE products SET is_flash_sale = false');
      // Set 12 produk dengan penjualan tertinggi sebagai Flash Sale
      const topRows = await dbManager.query('SELECT id FROM products ORDER BY sold_count DESC LIMIT ?', [limit]);
      if (topRows && topRows.length > 0) {
        const ids = topRows.map(r => r.id);
        const placeholders = ids.map(() => '?').join(', ');
        await dbManager.query(`UPDATE products SET is_flash_sale = true WHERE id IN (${placeholders})`, ids);
      }
    }
    return this.findFlashSale();
  }

  // Bersihkan semua produk dari Flash Sale
  async clearAllFlashSale() {
    if (dbManager.isConnected) {
      await dbManager.query('UPDATE products SET is_flash_sale = false');
    }
    return [];
  }
}

module.exports = new ProductModel();
