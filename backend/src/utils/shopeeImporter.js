const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const dbManager = require('../config/database');

class ShopeeImporter {
  /**
   * Mengubah image ID / hash Shopee menjadi URL gambar CDN lengkap
   */
  static formatShopeeImage(img) {
    if (!img) return 'images/product-placeholder.svg';
    if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
      return img;
    }
    // Hash format Shopee: misal id-11134207-822wq-... atau a1b2c3d4...
    return `https://down-id.img.susercontent.com/file/${img}`;
  }

  /**
   * Menormalkan harga (membersihkan Rp, titik, koma, atau format micro-currency Shopee)
   */
  static normalizePrice(val) {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') {
      // Shopee API sering mengembalikan harga dikali 100.000 (contoh: 25.000.000.000)
      if (val >= 100000000) {
        return Math.round(val / 100000);
      }
      return val;
    }
    const cleanStr = String(val).replace(/[^0-9]/g, '');
    let num = parseInt(cleanStr, 10) || 0;
    if (num >= 100000000) {
      num = Math.round(num / 100000);
    }
    return num;
  }

  /**
   * Menghasilkan slug URL yang rapi dan aman
   */
  static generateSlug(name, id) {
    const clean = String(name || 'produk')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);
    return id ? `${clean}-${id}` : clean;
  }

  /**
   * Mapping baris tunggal dari Shopee (baik dari Excel Seller Centre, API JSON, maupun CSV)
   */
  static normalizeProduct(item, index = 0) {
    const rawId = item.id || item.item_id || item['ID Produk'] || item['Product ID'] || item.itemId || `168part-${Date.now()}-${index}`;
    const id = String(rawId).startsWith('prod-') || String(rawId).startsWith('168part-') ? String(rawId) : `168part-${rawId}`;

    const name = (
      item.name ||
      item.item_name ||
      item['Nama Produk'] ||
      item['Product Name'] ||
      item.title ||
      'Produk 168part'
    ).trim();

    const price = this.normalizePrice(
      item.price ||
      item.price_min ||
      item['Harga'] ||
      item['Price'] ||
      item['Harga Jual'] ||
      item.original_price
    );

    let originalPrice = this.normalizePrice(
      item.originalPrice ||
      item.original_price ||
      item.price_before_discount ||
      item['Harga Asli'] ||
      item['Original Price']
    );

    if (!originalPrice || originalPrice <= price) {
      originalPrice = Math.round(price * 1.25);
    }

    const discountPercent = Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100));

    // Handle foto
    let image = null;
    if (item.image) {
      image = this.formatShopeeImage(item.image);
    } else if (Array.isArray(item.images) && item.images.length > 0) {
      image = this.formatShopeeImage(item.images[0]);
    } else if (item['Foto Sampul'] || item['Cover Image'] || item['Foto 1'] || item['Image 1']) {
      image = this.formatShopeeImage(item['Foto Sampul'] || item['Cover Image'] || item['Foto 1'] || item['Image 1']);
    } else {
      image = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80';
    }

    // Handle kategori
    let category = item.category || item.category_name || item['Kategori'] || item['Category'] || 'Handphone & Aksesoris';
    // Standarisasi kategori umum toko servis 168part
    const catLower = category.toLowerCase();
    if (catLower.includes('handphone') || catLower.includes('hp') || catLower.includes('lcd') || catLower.includes('touchscreen') || catLower.includes('sparepart')) {
      category = 'Handphone & Aksesoris';
    } else if (catLower.includes('elektronik') || catLower.includes('solder') || catLower.includes('power supply') || catLower.includes('tools')) {
      category = 'Elektronik';
    } else if (catLower.includes('mikroskop') || catLower.includes('kamera') || catLower.includes('foto')) {
      category = 'Fotografi';
    } else if (catLower.includes('komputer') || catLower.includes('pc') || catLower.includes('laptop')) {
      category = 'Komputer & Aksesoris';
    }

    // Specs
    let specs = [];
    if (Array.isArray(item.specs)) {
      specs = item.specs;
    } else if (typeof item.specs === 'string') {
      try {
        specs = JSON.parse(item.specs);
      } catch (e) {
        specs = item.specs.split('\n').filter(Boolean);
      }
    } else if (item.attributes && Array.isArray(item.attributes)) {
      specs = item.attributes.map(a => `${a.name || a.attribute_name}: ${a.value || a.attribute_value}`);
    } else if (item['Spesifikasi'] || item['Specs']) {
      specs = String(item['Spesifikasi'] || item['Specs']).split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    }

    const description = (
      item.description ||
      item['Deskripsi Produk'] ||
      item['Product Description'] ||
      item.desc ||
      `Produk original berkualitas dari official store 168part Surabaya. Jaminan mutu untuk kebutuhan teknisi servis HP & sparepart elektronik presisi.`
    ).trim();

    return {
      id,
      name,
      slug: this.generateSlug(name, id),
      category,
      price,
      originalPrice,
      discountPercent,
      rating: Number(item.rating || item.item_rating?.rating_star || 4.8),
      soldCount: Number(item.soldCount || item.historical_sold || item.sold || item['Terjual'] || Math.floor(Math.random() * 200) + 50),
      stock: Number(item.stock || item['Stok'] || item['Stock'] || 25),
      location: item.location || 'Kota Surabaya',
      shopName: item.shopName || '168part',
      shopType: item.shopType || 'Star+',
      icon: 'phone',
      image,
      bgPattern: '#f8fafc',
      isFlashSale: Boolean(item.isFlashSale || item.is_flash_sale),
      flashSaleSold: Number(item.flashSaleSold || item.flash_sale_sold || 0),
      description,
      specs: specs.length > 0 ? specs : [
        'Kualitas: 100% Original Equipment 168part',
        'Garansi: Garansi Tes / Fungsi Normal',
        'Pengemasan: Bubble Wrap Tebal & Kotak Pengaman',
        'Pengiriman: Ready Stock langsung dari Kota Surabaya'
      ]
    };
  }

  /**
   * Membaca file Excel (.xlsx / .xls) atau CSV dari Shopee Seller Centre
   */
  static parseFile(filePathOrBuffer) {
    let workbook;
    if (typeof filePathOrBuffer === 'string') {
      workbook = xlsx.readFile(filePathOrBuffer);
    } else {
      workbook = xlsx.read(filePathOrBuffer, { type: 'buffer' });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    return rawRows.map((r, i) => this.normalizeProduct(r, i));
  }

  /**
   * Menyimpan / memasukkan array produk ke Database SQLite, Supabase, dan Storage JSON
   */
  static async saveBatchToDatabase(products, replaceExisting = false) {
    if (!Array.isArray(products) || products.length === 0) {
      return { success: false, count: 0, message: 'Tidak ada produk untuk disimpan.' };
    }

    // Pastikan koneksi DB lokal siap
    if (!dbManager.isConnected) {
      await dbManager.init();
    }

    if (replaceExisting && dbManager.isConnected) {
      try {
        await dbManager.run('DELETE FROM products');
        console.log('🗑️ [Importer] Mengosongkan data produk lama sesuai opsi replace.');
      } catch (e) {
        console.warn('⚠️ [Importer] Gagal mengosongkan tabel:', e.message);
      }
    }

    let insertedCount = 0;

    for (const p of products) {
      try {
        if (dbManager.isConnected && dbManager.sqliteDb) {
          const sql = `
            INSERT INTO products (
              id, name, slug, category, price, original_price, discount_percent,
              rating, sold_count, stock, location, shop_name, shop_type,
              icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              price = excluded.price,
              original_price = excluded.original_price,
              stock = excluded.stock,
              image = excluded.image,
              description = excluded.description,
              specs = excluded.specs,
              shop_name = excluded.shop_name,
              location = excluded.location;
          `;
          await dbManager.run(sql, [
            p.id,
            p.name,
            p.slug,
            p.category,
            p.price,
            p.originalPrice,
            p.discountPercent,
            p.rating,
            p.soldCount,
            p.stock,
            p.location,
            p.shopName,
            p.shopType,
            p.icon,
            p.image,
            p.bgPattern,
            p.isFlashSale ? 1 : 0,
            p.flashSaleSold,
            p.description,
            JSON.stringify(p.specs)
          ]);
          insertedCount++;
        }
      } catch (err) {
        console.error(`❌ [Importer] Gagal simpan ${p.id}:`, err.message);
      }
    }

    return {
      success: true,
      count: insertedCount,
      totalReceived: products.length,
      message: `Berhasil mengimpor ${insertedCount} produk 168part ke database Supabase!`
    };
  }
}

module.exports = ShopeeImporter;
