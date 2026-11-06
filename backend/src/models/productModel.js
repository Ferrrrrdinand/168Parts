const dbManager = require('../config/database');
const storage = require('./storage');
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
      image: data.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80',
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
        productPayload.isFlashSale ? 1 : 0,
        productPayload.flashSaleSold,
        productPayload.description,
        JSON.stringify(productPayload.specs)
      ]);
    }

    // Selaraskan juga ke file storage cadangan
    const db = storage.read();
    if (!db.products) db.products = [];
    db.products.unshift(productPayload);
    storage.write(db);

    return productPayload;
  }

  // READ ALL: Mengambil Semua Produk dari Database Lokal / Cloud
  async findAll(filter = {}) {
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      try {
        let query = dbManager.supabaseClient.from('products').select('*');
        if (filter.q && filter.q.trim()) {
          const kw = filter.q.trim();
          query = query.or(`name.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%,shop_name.ilike.%${kw}%`);
        }
        if (filter.category && filter.category !== 'Semua') {
          query = query.eq('category', filter.category);
        }
        if (filter.minPrice) query = query.gte('price', Number(filter.minPrice));
        if (filter.maxPrice) query = query.lte('price', Number(filter.maxPrice));
        if (filter.rating) query = query.gte('rating', Number(filter.rating));
        if (filter.location) query = query.ilike('location', `%${filter.location}%`);
        if (filter.shopType) query = query.eq('shop_type', filter.shopType);

        if (filter.sort === 'price_asc') query = query.order('price', { ascending: true });
        else if (filter.sort === 'price_desc') query = query.order('price', { ascending: false });
        else if (filter.sort === 'top_sales') query = query.order('sold_count', { ascending: false });
        else if (filter.sort === 'rating') query = query.order('rating', { ascending: false });
        else if (filter.sort === 'latest') query = query.order('created_at', { ascending: false });
        else query = query.order('is_flash_sale', { ascending: false }).order('id', { ascending: true });

        if (filter.limit) {
          const limit = parseInt(filter.limit, 10);
          const offset = parseInt(filter.offset, 10) || 0;
          query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map(r => this.formatProductRow(r));
        }
      } catch (err) {
        console.warn('⚠️ Supabase findAll error:', err.message);
      }
    }

    if (dbManager.isConnected) {
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
      return rows.map(r => this.formatProductRow(r));
    }

    // Fallback JSON Engine jika DB belum connected
    const db = storage.read();
    return db.products || [];
  }

  // READ ONE: Mengambil 1 Produk Berdasarkan ID
  async findById(id) {
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      try {
        const { data, error } = await dbManager.supabaseClient
          .from('products')
          .select('*')
          .or(`id.eq.${id},slug.eq.${id}`)
          .maybeSingle();
        if (!error && data) {
          return this.formatProductRow(data);
        }
      } catch (err) {
        console.warn('⚠️ Supabase findById error:', err.message);
      }
    }

    if (dbManager.isConnected) {
      const rows = await dbManager.query('SELECT * FROM products WHERE id = ? OR slug = ? LIMIT 1', [id, id]);
      if (rows.length > 0) {
        return this.formatProductRow(rows[0]);
      }
      return null;
    }

    const db = storage.read();
    return (db.products || []).find(p => p.id === id || p.slug === id) || null;
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
        merged.isFlashSale ? 1 : 0,
        merged.description,
        JSON.stringify(merged.specs || []),
        id
      ]);
    }

    // Update di JSON Storage cadangan
    const db = storage.read();
    const idx = (db.products || []).findIndex(p => p.id === id);
    if (idx > -1) {
      db.products[idx] = merged;
      storage.write(db);
    }

    return merged;
  }

  // DELETE: Menghapus Produk dari Database Lokal (CRUD - D)
  async delete(id) {
    let deleted = false;
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      try {
        const { error } = await dbManager.supabaseClient.from('products').delete().eq('id', id);
        if (!error) deleted = true;
      } catch (err) {
        console.warn('⚠️ Supabase delete error:', err.message);
      }
    } else if (dbManager.isConnected) {
      const res = await dbManager.query('DELETE FROM products WHERE id = ?', [id]);
      if (res && res[0] && res[0].affectedRows > 0) deleted = true;
    }

    const db = storage.read();
    const prevCount = (db.products || []).length;
    db.products = (db.products || []).filter(p => p.id !== id);
    if (db.products.length < prevCount) deleted = true;
    storage.write(db);

    return deleted;
  }

  // FLASH SALE
  async findFlashSale() {
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      try {
        const { data, error } = await dbManager.supabaseClient
          .from('products')
          .select('*')
          .eq('is_flash_sale', true)
          .order('flash_sale_sold', { ascending: false })
          .limit(12);
        if (!error && data) {
          return data.map(r => this.formatProductRow(r));
        }
      } catch (err) {
        console.warn('⚠️ Supabase findFlashSale error:', err.message);
      }
    }

    if (dbManager.isConnected) {
      const rows = await dbManager.query('SELECT * FROM products WHERE is_flash_sale = 1 ORDER BY flash_sale_sold DESC LIMIT 12');
      return rows.map(r => this.formatProductRow(r));
    }
    const db = storage.read();
    return (db.products || []).filter(p => p.isFlashSale);
  }
}

module.exports = new ProductModel();
