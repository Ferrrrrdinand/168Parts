require('dotenv').config();
const dbManager = require('../config/database');

async function migrate() {
  console.log('⚡ Menjalankan migrasi database pengembalian barang & lacak tanggal sampai...');
  
  // 1. Kolom arrived_at dan return_status pada tabel orders
  await dbManager.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP;
  `);
  console.log('✓ Kolom arrived_at siap.');

  await dbManager.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'none';
  `);
  console.log('✓ Kolom return_status siap.');

  // 2. Tabel order_returns
  await dbManager.query(`
    CREATE TABLE IF NOT EXISTS order_returns (
      id VARCHAR(50) PRIMARY KEY,
      order_id VARCHAR(50) NOT NULL,
      user_id VARCHAR(100) NOT NULL,
      user_name VARCHAR(150),
      reason TEXT NOT NULL,
      video_data TEXT NOT NULL,
      photos_data TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Menunggu Review Admin',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✓ Tabel order_returns berhasil dibuat di Supabase Cloud.');

  console.log('🎉 Migrasi selesai dengan sukses!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Gagal migrasi:', err.message);
  process.exit(1);
});

