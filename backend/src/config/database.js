require('dotenv').config();
const { Pool } = require('pg');

const SUPABASE_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres.vgraouxizjvfnpzfebyb:168parts2026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vgraouxizjvfnpzfebyb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

class DatabaseManager {
  constructor() {
    this.dbType = 'supabase';
    this.pgPool = null;
    this.supabaseClient = null;
    this.isConnected = false;
  }

  async init() {
    console.log('⚡ [Database] Menghubungkan ke Supabase Cloud PostgreSQL...');
    const connected = await this.initSupabase();
    if (!connected) {
      console.error('❌ [Database] Gagal terhubung ke Supabase Cloud! Database lokal dinonaktifkan.');
      throw new Error('Koneksi database Supabase Cloud gagal. Tidak menggunakan database lokal.');
    }
    console.log('✅ [Database Cloud] Sistem 100% menggunakan Supabase Cloud (PostgreSQL). Database lokal tidak digunakan.');
    return true;
  }

  /* ---------------- SUPABASE CLOUD POSTGRESQL ---------------- */
  async initSupabase() {
    try {
      // 1. Inisialisasi Supabase JS Client (Opsional)
      if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_KEY.includes('your-supabase')) {
        try {
          const { createClient } = require('@supabase/supabase-js');
          this.supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
          console.log(`⚡ [Supabase] SDK Client terhubung: ${SUPABASE_URL}`);
        } catch (e) {
          console.warn('⚠️ [Supabase SDK] Inisialisasi SDK gagal:', e.message);
        }
      }

      // 2. Inisialisasi PostgreSQL Connection Pooler (Utama)
      this.pgPool = new Pool({
        connectionString: SUPABASE_DB_URL,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });

      const res = await this.pgPool.query('SELECT NOW() as connected_at, current_database() as db_name');
      if (res && res.rows && res.rows.length > 0) {
        this.isConnected = true;
        this.dbType = 'supabase';
        console.log(`🐬 [Supabase PostgreSQL] Berhasil terhubung ke database: "${res.rows[0].db_name}" (${res.rows[0].connected_at})`);
        return true;
      }

      return false;
    } catch (err) {
      console.error('❌ [Supabase PostgreSQL] Kesalahan koneksi:', err.message);
      this.pgPool = null;
      this.isConnected = false;
      return false;
    }
  }

  getSupabase() {
    return this.supabaseClient;
  }

  /* ---------------- QUERY EXECUTION (POSTGRESQL) ---------------- */
  async query(sql, params = []) {
    if (!this.pgPool) {
      await this.init();
    }

    if (!this.pgPool) {
      throw new Error('Database Supabase tidak terhubung.');
    }

    // Konversi placeholder '?' ke '$1, $2, ...' untuk PostgreSQL
    let paramIndex = 1;
    let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

    // Replace LIKE dengan ILIKE untuk case-insensitive search
    pgSql = pgSql.replace(/\bLIKE\b/g, 'ILIKE');

    // Normalisasi perbandingan boolean untuk PostgreSQL
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

  async run(sql, params = []) {
    const res = await this.query(sql, params);
    const affected = res && res[0] ? (res[0].affectedRows || 0) : 0;
    return { changes: affected, lastID: null };
  }

  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  async all(sql, params = []) {
    return await this.query(sql, params);
  }
}

module.exports = new DatabaseManager();
