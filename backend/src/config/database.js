require('dotenv').config();
const { Pool } = require('pg');

const PRIMARY_SUPABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.vgraouxizjvfnpzfebyb:168parts2026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
// Fallback URL: jika port 5432 gagal/terhambat, coba port 6543 (transaction mode), atau sebaliknya
const FALLBACK_SUPABASE_URL = PRIMARY_SUPABASE_URL.includes(':5432')
  ? PRIMARY_SUPABASE_URL.replace(':5432', ':6543')
  : (PRIMARY_SUPABASE_URL.includes(':6543') ? PRIMARY_SUPABASE_URL.replace(':6543', ':5432') : null);

const SUPABASE_REST_URL = process.env.SUPABASE_URL || 'https://vgraouxizjvfnpzfebyb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NOW_REGION;

class DatabaseManager {
  constructor() {
    this.dbType = 'supabase';
    this.pgPool = null;
    this.supabaseClient = null;
    this.isConnected = false;
    this.lastError = null;
    this.activeUrl = PRIMARY_SUPABASE_URL;
  }

  async init() {
    console.log('⚡ [Database] Menghubungkan ke Supabase Cloud PostgreSQL...');
    this.lastError = null;

    // Coba dengan primary URL terlebih dahulu
    let connected = await this.tryConnect(this.activeUrl);

    // Jika gagal dan ada fallback URL, coba fallback
    if (!connected && FALLBACK_SUPABASE_URL && FALLBACK_SUPABASE_URL !== this.activeUrl) {
      console.warn('⚠️ [Database] Primary pooler gagal, mencoba alternatif pooler port...');
      connected = await this.tryConnect(FALLBACK_SUPABASE_URL);
      if (connected) {
        this.activeUrl = FALLBACK_SUPABASE_URL;
      }
    }

    if (!connected) {
      console.error('❌ [Database] Gagal terhubung ke Supabase Cloud! Database lokal dinonaktifkan.');
      throw new Error(this.lastError ? `Koneksi database Supabase gagal: ${this.lastError.message}` : 'Koneksi database Supabase Cloud gagal.');
    }

    console.log('✅ [Database Cloud] Sistem 100% menggunakan Supabase Cloud (PostgreSQL). Database lokal tidak digunakan.');
    return true;
  }

  /* ---------------- COBA KONEKSI KE POOLER ---------------- */
  async tryConnect(connString) {
    let pool = null;
    try {
      // 1. Inisialisasi Supabase JS Client (Opsional)
      if (!this.supabaseClient && SUPABASE_REST_URL && SUPABASE_KEY && !SUPABASE_KEY.includes('your-supabase')) {
        try {
          const { createClient } = require('@supabase/supabase-js');
          this.supabaseClient = createClient(SUPABASE_REST_URL, SUPABASE_KEY);
        } catch (e) {
          console.warn('⚠️ [Supabase SDK] Inisialisasi SDK gagal:', e.message);
        }
      }

      // 2. Konfigurasi Pooler Khusus Serverless & Cloud Resilience
      // max connection dibatasi agar tidak melampaui kuota Supavisor pooler
      pool = new Pool({
        connectionString: connString,
        ssl: { rejectUnauthorized: false },
        max: isServerless ? 2 : 5,
        idleTimeoutMillis: isServerless ? 3000 : 15000,
        connectionTimeoutMillis: 8000,
        allowExitOnIdle: true
      });

      // Mencegah unhandled error pada idle client yang diputus oleh server
      pool.on('error', (err) => {
        console.warn('⚠️ [Supabase Pool Idle Client Notice]:', err.message);
        if (err.message && (err.message.includes('terminat') || err.message.includes('closed'))) {
          this.isConnected = false;
        }
      });

      const res = await pool.query('SELECT NOW() as connected_at, current_database() as db_name');
      if (res && res.rows && res.rows.length > 0) {
        // Bersihkan pool lama jika ada
        if (this.pgPool && this.pgPool !== pool) {
          try { await this.pgPool.end(); } catch (e) {}
        }
        this.pgPool = pool;
        this.isConnected = true;
        this.lastError = null;
        console.log(`🐬 [Supabase PostgreSQL] Berhasil terhubung ke database: "${res.rows[0].db_name}" (${res.rows[0].connected_at})`);
        return true;
      }

      return false;
    } catch (err) {
      console.error(`❌ [Supabase PostgreSQL] Kesalahan koneksi (${connString.includes(':5432') ? 'port 5432' : 'port 6543'}):`, err.message);
      this.lastError = {
        message: err.message,
        code: err.code || 'UNKNOWN',
        timestamp: new Date().toISOString()
      };
      if (pool) {
        try { await pool.end(); } catch (e) {}
      }
      return false;
    }
  }

  getSupabase() {
    return this.supabaseClient;
  }

  /* ---------------- QUERY EXECUTION (POSTGRESQL) ---------------- */
  async query(sql, params = []) {
    if (!this.pgPool || !this.isConnected) {
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

    try {
      const res = await this.pgPool.query(pgSql, params);
      const trimmed = sql.trim().toUpperCase();

      if (trimmed.startsWith('SELECT')) {
        return res.rows;
      } else {
        return [{ affectedRows: res.rowCount, insertId: null, rows: res.rows }];
      }
    } catch (err) {
      const isConnErr = err.message && (
        err.message.includes('Connection') ||
        err.message.includes('closed') ||
        err.message.includes('terminat') ||
        err.message.includes('timeout') ||
        err.message.includes('socket') ||
        err.message.includes('Client has encountered')
      );

      // Auto-reconnect & retry query 1x bila terputus koneksi
      if (isConnErr) {
        console.warn('🔄 [Database] Terjadi diskoneksi jaringan pooler, mencoba re-init & retry query 1x...', err.message);
        this.pgPool = null;
        this.isConnected = false;
        try {
          await this.init();
          const retryRes = await this.pgPool.query(pgSql, params);
          const trimmed = sql.trim().toUpperCase();
          if (trimmed.startsWith('SELECT')) {
            return retryRes.rows;
          } else {
            return [{ affectedRows: retryRes.rowCount, insertId: null, rows: retryRes.rows }];
          }
        } catch (retryErr) {
          this.lastError = {
            message: retryErr.message,
            code: retryErr.code || 'RETRY_FAILED',
            timestamp: new Date().toISOString()
          };
          throw retryErr;
        }
      }

      throw err;
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
