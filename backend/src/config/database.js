require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const seedProducts = require('../../data/seedProducts');

class DatabaseManager {
  constructor() {
    this.dbType = (process.env.DB_TYPE || 'supabase').toLowerCase();
    this.sqliteDb = null;
    this.mysqlPool = null;
    this.pgPool = null;
    this.supabaseClient = null;
    this.isConnected = false;
  }

  async init() {
    this.dbType = (process.env.DB_TYPE || 'supabase').toLowerCase();
    if (this.dbType === 'supabase' || this.dbType === 'postgres') {
      const supabaseOk = await this.initSupabase();
      if (supabaseOk) {
        console.log('✅ [Database Cloud] Sistem 100% menggunakan Supabase Cloud (PostgreSQL). Database lokal tidak digunakan.');
        return true;
      }
      console.error('❌ [Database] Gagal terhubung ke Supabase Cloud!');
      throw new Error('Supabase Cloud connection failed. Database lokal dinonaktifkan.');
    } else if (this.dbType === 'mysql') {
      const mysqlOk = await this.initMySQL();
      if (mysqlOk) return true;
      console.log('🔄 [Database] Beralih otomatis ke Database SQL Lokal (SQLite)...');
      this.dbType = 'sqlite';
    }

    return await this.initSQLite();
  }

  /* ---------------- 1. SUPABASE (CLOUD POSTGRESQL & API) ---------------- */
  async initSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

      let clientReady = false;
      let pgReady = false;

      // 1A. Supabase JS Client (HTTPS / REST)
      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
        try {
          const { createClient } = require('@supabase/supabase-js');
          this.supabaseClient = createClient(supabaseUrl, supabaseKey);
          clientReady = true;
          console.log(`⚡ [Supabase] SDK Client terhubung: ${supabaseUrl}`);
        } catch (e) {
          console.warn('⚠️ [Supabase SDK] Inisialisasi SDK gagal:', e.message);
        }
      }

      // 1B. Supabase PostgreSQL Pool via pg (Direct connection string)
      if (databaseUrl && !databaseUrl.includes('[YOUR-PASSWORD]')) {
        try {
          const { Pool } = require('pg');
          this.pgPool = new Pool({
            connectionString: databaseUrl,
            ssl: { rejectUnauthorized: false }
          });
          const res = await this.pgPool.query('SELECT NOW()');
          if (res && res.rows && res.rows.length > 0) {
            pgReady = true;
            console.log(`🐬 [Supabase PostgreSQL] Berhasil terhubung via connection string!`);
          }
        } catch (e) {
          console.warn('⚠️ [Supabase PostgreSQL] Gagal terhubung via DATABASE_URL:', e.message);
          this.pgPool = null;
        }
      }

      if (pgReady || clientReady) {
        this.isConnected = true;
        this.dbType = 'supabase';
        console.log('✅ [Database Cloud] Supabase aktif sebagai database utama!');
        return true;
      }

      console.warn('⚠️ [Supabase] Kredensial Supabase di .env belum diatur atau masih bernilai default.');
      return false;
    } catch (err) {
      console.warn('⚠️ [Supabase] Terjadi kesalahan saat inisialisasi Supabase:', err.message);
      return false;
    }
  }

  getSupabase() {
    return this.supabaseClient;
  }

  /* ---------------- 1. SQLITE LOKAL ---------------- */
  async initSQLite() {
    const dbFilePath = path.resolve(process.env.SQLITE_FILE || path.join(__dirname, '../../data/pasarin_local.db'));
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve) => {
      this.sqliteDb = new sqlite3.Database(dbFilePath, async (err) => {
        if (err) {
          console.error('❌ [SQLite] Gagal membuka database lokal:', err.message);
          this.isConnected = false;
          resolve(false);
          return;
        }

        this.isConnected = true;
        this.dbType = 'sqlite';
        console.log(`📦 [Database Lokal] Berhasil terhubung ke file database: ${path.basename(dbFilePath)}`);

        await this.migrateSQLiteTables();
        resolve(true);
      });
    });
  }

  async migrateSQLiteTables() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        discount_percent INTEGER DEFAULT 0,
        rating REAL DEFAULT 5.0,
        sold_count INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 10,
        location TEXT DEFAULT 'Indonesia',
        shop_name TEXT DEFAULT 'Pasarin Partner',
        shop_type TEXT DEFAULT 'Star',
        icon TEXT DEFAULT 'bag',
        image TEXT,
        bg_pattern TEXT DEFAULT '#f8fafc',
        is_flash_sale INTEGER DEFAULT 0,
        flash_sale_sold INTEGER DEFAULT 0,
        description TEXT,
        specs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.run(createTableSQL);

    // Cek apakah data produk sudah ada
    const row = await this.get('SELECT COUNT(*) as cnt FROM products');
    if (!row || row.cnt === 0) {
      console.log(`🌱 [Database Lokal] Mengisi data awal (${seedProducts.length} produk)...`);
      for (const p of seedProducts) {
        const insertSQL = `
          INSERT INTO products (
            id, name, slug, category, price, original_price, discount_percent,
            rating, sold_count, stock, location, shop_name, shop_type,
            icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await this.run(insertSQL, [
          p.id,
          p.name,
          p.slug || p.id,
          p.category || 'Lainnya',
          p.price || 0,
          p.originalPrice || null,
          p.discountPercent || 0,
          p.rating || 5.0,
          p.soldCount || 0,
          p.stock || 25,
          p.location || 'Indonesia',
          p.shopName || 'Pasarin Store',
          p.shopType || 'Star',
          p.icon || 'bag',
          p.image || null,
          p.bgPattern || '#f8fafc',
          p.isFlashSale ? 1 : 0,
          p.flashSaleSold || 0,
          p.description || '',
          JSON.stringify(p.specs || [])
        ]);
      }
      console.log(`✅ [Database Lokal] Selesai seeding ${seedProducts.length} produk ke database lokal.`);
    }

    // Tabel Promos
    const createPromosTableSQL = `
      CREATE TABLE IF NOT EXISTS promos (
        code TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_spend REAL DEFAULT 0,
        max_discount REAL,
        quota INTEGER DEFAULT 100,
        used_count INTEGER DEFAULT 0,
        category TEXT DEFAULT 'diskon',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.run(createPromosTableSQL);

    // Seeding default promos
    const promoCount = await this.get('SELECT COUNT(*) as cnt FROM promos');
    if (!promoCount || promoCount.cnt === 0) {
      console.log('🌱 [Database Lokal] Mengisi data promo default...');
      const defaultPromos = [
        { code: 'PASARINBARU', title: 'Voucher Pengguna Baru', description: 'Diskon 100% s.d Rp100.000', discount_type: 'fixed', discount_value: 100000, min_spend: 0, max_discount: 100000, quota: 150, category: 'diskon' },
        { code: 'ONGKIRXTRA', title: 'Gratis Ongkir Xtra Se-Indonesia', description: 'Subsidi ongkir s.d Rp50.000', discount_type: 'fixed', discount_value: 50000, min_spend: 30000, max_discount: 50000, quota: 500, category: 'ongkir' },
        { code: 'FLASHSALE80', title: 'Flash Sale Kilat Super Murah', description: 'Diskon ekstra s.d 80%', discount_type: 'percent', discount_value: 80, min_spend: 50000, max_discount: 200000, quota: 50, category: 'diskon' },
        { code: 'CASHBACK50', title: 'Cashback Kilat 50% PasarinPay', description: 'Cashback Koin s.d Rp50.000', discount_type: 'percent', discount_value: 50, min_spend: 50000, max_discount: 50000, quota: 100, category: 'cashback' },
        { code: 'PILIHLOKAL', title: 'Bangga Buatan Lokal (UMKM)', description: 'Potongan langsung Rp25.000 khusus UMKM', discount_type: 'fixed', discount_value: 25000, min_spend: 75000, max_discount: 25000, quota: 200, category: 'lokal' },
        { code: 'GAJIANHEMAT', title: 'Ekstra Diskon Gajian (Payday Sale)', description: 'Ekstra potongan 15% semua kategori', discount_type: 'percent', discount_value: 15, min_spend: 150000, max_discount: 150000, quota: 100, category: 'diskon' }
      ];

      for (const p of defaultPromos) {
        await this.run(`
          INSERT INTO promos (code, title, description, discount_type, discount_value, min_spend, max_discount, quota, used_count, category, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)
        `, [p.code, p.title, p.description, p.discount_type, p.discount_value, p.min_spend, p.max_discount, p.quota, p.category]);
      }
      console.log('✅ [Database Lokal] Berhasil seeding 6 promo bawaan.');
    }

    // 3. Tabel Users (Pengguna)
    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        role TEXT DEFAULT 'buyer',
        salt TEXT NOT NULL,
        hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.run(createUsersTableSQL);

    // Seeding demo user dan admin jika belum ada
    const userCount = await this.get('SELECT COUNT(*) as cnt FROM users');
    if (!userCount || userCount.cnt === 0) {
      const crypto = require('crypto');
      const hashPwd = (pwd) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(pwd, salt, 1000, 64, 'sha512').toString('hex');
        return { salt, hash };
      };
      const demoUser = hashPwd('demo123');
      const adminUser = hashPwd('admin123');

      await this.run(`
        INSERT INTO users (id, name, email, phone, role, salt, hash)
        VALUES 
          ('user-demo-1', 'Budi Santoso', 'demo@pasarin.com', '081234567890', 'buyer', ?, ?),
          ('user-admin-1', 'Super Admin Pasarin', 'admin@pasarin.com', '081122334455', 'admin', ?, ?)
      `, [demoUser.salt, demoUser.hash, adminUser.salt, adminUser.hash]);
      console.log('✅ [Database Lokal] Berhasil seeding akun Demo & Super Admin.');
    }

    // 4. Tabel Orders (Pesanan Pelanggan)
    const createOrdersTableSQL = `
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        items TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        notes TEXT,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'Sedang Diproses',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.run(createOrdersTableSQL);

    // 5. Tabel Banners (Pengaturan Banner Hero)
    const createBannersTableSQL = `
      CREATE TABLE IF NOT EXISTS banners (
        id TEXT PRIMARY KEY,
        config_json TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.run(createBannersTableSQL);

    // Seeding default banner jika belum ada
    const bannerCount = await this.get('SELECT COUNT(*) as cnt FROM banners');
    if (!bannerCount || bannerCount.cnt === 0) {
      const defaultBanner = {
        left: {
          badge: "✨ PASARIN PILIH LOKAL",
          title: "Kreasi Unggulan & Inovasi Nusantara",
          subtitle: "Karya Terbaik Anak Bangsa",
          pills: [
            "🏷️ Produk Unik Asli Indonesia",
            "⚡ Inovasi Lokal Rasa Global",
            "⭐ Kualitas Unggulan Nusantara"
          ],
          modelImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80",
          bgGradient: "linear-gradient(135deg, #1d3f0d 0%, #285715 100%)",
          targetUrl: "#/search?category=Pilih+Lokal"
        },
        right: {
          title: "Spesial Diskon & Voucher",
          modelImage1: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80",
          modelImage2: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80",
          pill1Title: "DISKON S.D.",
          pill1Val: "80%",
          pill2Title: "VOUCHER",
          pill2Val: "100RB",
          bgGradient: "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #4c1d95 100%)",
          targetUrl: "#/search?q=promo"
        }
      };
      await this.run(
        `INSERT INTO banners (id, config_json) VALUES ('main_banner', ?)`,
        [JSON.stringify(defaultBanner)]
      );
      console.log('✅ [Database Lokal] Berhasil seeding konfigurasi default banner.');
    }
  }

  /* ---------------- 2. MYSQL (OPSIONAL) ---------------- */
  async initMySQL() {
    try {
      const mysql = require('mysql2/promise');
      const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
      };

      const tempConn = await mysql.createConnection(dbConfig);
      const dbName = process.env.DB_NAME || 'pasarin_db';
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await tempConn.end();

      this.mysqlPool = mysql.createPool({ ...dbConfig, database: dbName });
      await this.mysqlPool.query('SELECT 1');

      this.isConnected = true;
      this.dbType = 'mysql';
      console.log(`🐬 [MySQL] Berhasil terhubung ke database "${dbName}"`);
      return true;
    } catch (err) {
      console.warn(`⚠️ [MySQL] Tidak dapat terhubung ke MySQL (${err.code || err.message}).`);
      return false;
    }
  }

  /* ---------------- 3. UNIFIED QUERY HELPER ---------------- */
  // Method seragam untuk menjalankan SQL query di database yang aktif
  async query(sql, params = []) {
    if (this.dbType === 'sqlite' && this.sqliteDb) {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT')) {
        return await this.all(sql, params);
      } else {
        const res = await this.run(sql, params);
        return [{ affectedRows: res.changes, insertId: res.lastID }];
      }
    } else if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.query(sql, params);
      return rows;
    } else if ((this.dbType === 'supabase' || this.dbType === 'postgres') && this.pgPool) {
      let paramIndex = 1;
      let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      // Replace LIKE with ILIKE for case-insensitivity on PostgreSQL
      pgSql = pgSql.replace(/\bLIKE\b/g, 'ILIKE');
      // Normalize boolean comparisons for PostgreSQL
      pgSql = pgSql.replace(/is_flash_sale\s*=\s*1/gi, 'is_flash_sale = true');
      pgSql = pgSql.replace(/is_flash_sale\s*=\s*0/gi, 'is_flash_sale = false');
      pgSql = pgSql.replace(/is_active\s*=\s*1/gi, 'is_active = true');
      pgSql = pgSql.replace(/is_active\s*=\s*0/gi, 'is_active = false');

      const res = await this.pgPool.query(pgSql, params);
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT')) {
        return res.rows;
      } else {
        return [{ affectedRows: res.rowCount, insertId: null, rows: res.rows }];
      }
    }
    return [];
  }

  // Promise-based Helper Wrappers (Multi-Database Support)
  async run(sql, params = []) {
    if (this.dbType === 'sqlite' && this.sqliteDb) {
      return new Promise((resolve, reject) => {
        this.sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
        });
      });
    }
    const res = await this.query(sql, params);
    const affected = res && res[0] ? (res[0].affectedRows || 0) : 0;
    return { changes: affected, lastID: null };
  }

  async get(sql, params = []) {
    if (this.dbType === 'sqlite' && this.sqliteDb) {
      return new Promise((resolve, reject) => {
        this.sqliteDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
    const rows = await this.query(sql, params);
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  async all(sql, params = []) {
    if (this.dbType === 'sqlite' && this.sqliteDb) {
      return new Promise((resolve, reject) => {
        this.sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
    return await this.query(sql, params);
  }
}

module.exports = new DatabaseManager();
