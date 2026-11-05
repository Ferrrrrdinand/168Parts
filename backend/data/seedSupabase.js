/**
 * Pasarin / 168Parts - Script Seeding Otomatis ke Supabase
 * Jalankan dengan: npm run seed:supabase
 */

require('dotenv').config();
const seedProducts = require('./seedProducts');

const defaultPromos = [
  { code: 'PASARINBARU', title: 'Voucher Pengguna Baru', description: 'Diskon 100% s.d Rp100.000', discount_type: 'fixed', discount_value: 100000, min_spend: 0, max_discount: 100000, quota: 150, category: 'diskon' },
  { code: 'ONGKIRXTRA', title: 'Gratis Ongkir Xtra Se-Indonesia', description: 'Subsidi ongkir s.d Rp50.000', discount_type: 'fixed', discount_value: 50000, min_spend: 30000, max_discount: 50000, quota: 500, category: 'ongkir' },
  { code: 'FLASHSALE80', title: 'Flash Sale Kilat Super Murah', description: 'Diskon ekstra s.d 80%', discount_type: 'percent', discount_value: 80, min_spend: 50000, max_discount: 200000, quota: 50, category: 'diskon' },
  { code: 'CASHBACK50', title: 'Cashback Kilat 50% PasarinPay', description: 'Cashback Koin s.d Rp50.000', discount_type: 'percent', discount_value: 50, min_spend: 50000, max_discount: 50000, quota: 100, category: 'cashback' },
  { code: 'PILIHLOKAL', title: 'Bangga Buatan Lokal (UMKM)', description: 'Potongan langsung Rp25.000 khusus UMKM', discount_type: 'fixed', discount_value: 25000, min_spend: 75000, max_discount: 25000, quota: 200, category: 'lokal' },
  { code: 'GAJIANHEMAT', title: 'Ekstra Diskon Gajian (Payday Sale)', description: 'Ekstra potongan 15% semua kategori', discount_type: 'percent', discount_value: 15, min_spend: 150000, max_discount: 150000, quota: 100, category: 'diskon' }
];

async function seed() {
  console.log('========================================================');
  console.log('⚡ [Supabase Seeder] Memulai proses seeding ke Supabase...');
  console.log('========================================================');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  // 1. Coba lewat PostgreSQL Connection Pool jika ada
  if (databaseUrl) {
    try {
      console.log('🔗 Mencoba koneksi langsung via DATABASE_URL (pg)...');
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      });

      // Seeding Products
      console.log(`📦 Memasukkan ${seedProducts.length} data produk...`);
      for (const p of seedProducts) {
        const sql = `
          INSERT INTO products (
            id, name, slug, category, price, original_price, discount_percent,
            rating, sold_count, stock, location, shop_name, shop_type,
            icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            stock = EXCLUDED.stock,
            specs = EXCLUDED.specs;
        `;
        await pool.query(sql, [
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
          Boolean(p.isFlashSale),
          p.flashSaleSold || 0,
          p.description || '',
          JSON.stringify(p.specs || [])
        ]);
      }
      console.log('✅ Produk berhasil disimpan di Supabase via pg!');

      // Seeding Promos
      console.log(`🏷️ Memasukkan ${defaultPromos.length} promo bawaan...`);
      for (const p of defaultPromos) {
        const sql = `
          INSERT INTO promos (
            code, title, description, discount_type, discount_value,
            min_spend, max_discount, quota, used_count, category, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, TRUE)
          ON CONFLICT (code) DO NOTHING;
        `;
        await pool.query(sql, [
          p.code, p.title, p.description, p.discount_type, p.discount_value,
          p.min_spend, p.max_discount, p.quota, p.category
        ]);
      }
      console.log('✅ Promo berhasil disimpan di Supabase via pg!');
      await pool.end();
      console.log('🎉 Seeding Supabase Selesai dengan sukses!');
      return;
    } catch (err) {
      console.warn('⚠️ Seeding via pg gagal/dilewati:', err.message);
    }
  }

  // 2. Coba lewat Supabase Client SDK
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
    try {
      console.log('⚡ Mencoba seeding via @supabase/supabase-js SDK...');
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Produk
      const productPayloads = seedProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        category: p.category || 'Lainnya',
        price: p.price || 0,
        original_price: p.originalPrice || null,
        discount_percent: p.discountPercent || 0,
        rating: p.rating || 5.0,
        sold_count: p.soldCount || 0,
        stock: p.stock || 25,
        location: p.location || 'Indonesia',
        shop_name: p.shopName || 'Pasarin Store',
        shop_type: p.shopType || 'Star',
        icon: p.icon || 'bag',
        image: p.image || null,
        bg_pattern: p.bgPattern || '#f8fafc',
        is_flash_sale: Boolean(p.isFlashSale),
        flash_sale_sold: p.flashSaleSold || 0,
        description: p.description || '',
        specs: p.specs || []
      }));

      const { error: prodErr } = await supabase
        .from('products')
        .upsert(productPayloads, { onConflict: 'id' });

      if (prodErr) {
        console.error('❌ Gagal seeding produk ke Supabase:', prodErr.message);
        console.log('💡 Tip: Pastikan tabel "products" sudah dibuat di Supabase SQL Editor menggunakan file "backend/data/supabase_schema.sql".');
      } else {
        console.log(`✅ Berhasil upsert ${productPayloads.length} produk ke Supabase via SDK!`);
      }

      // Promo
      const promoPayloads = defaultPromos.map(p => ({
        code: p.code,
        title: p.title,
        description: p.description,
        discount_type: p.discount_type,
        discount_value: p.discount_value,
        min_spend: p.min_spend,
        max_discount: p.max_discount,
        quota: p.quota,
        used_count: 0,
        category: p.category,
        is_active: true
      }));

      const { error: promoErr } = await supabase
        .from('promos')
        .upsert(promoPayloads, { onConflict: 'code' });

      if (promoErr) {
        console.error('❌ Gagal seeding promo ke Supabase:', promoErr.message);
      } else {
        console.log(`✅ Berhasil upsert ${promoPayloads.length} promo ke Supabase via SDK!`);
      }

      console.log('🎉 Seeding Supabase via SDK Selesai!');
      return;
    } catch (err) {
      console.error('❌ Error seeding Supabase SDK:', err.message);
    }
  }

  // Jika kredensial belum ada
  console.log('\n⚠️  Kredensial Supabase belum diatur di file .env.');
  console.log('👉 Untuk menghubungkan ke Supabase:');
  console.log('1. Buat project baru di https://supabase.com');
  console.log('2. Buka SQL Editor di dashboard Supabase lalu jalankan script: backend/data/supabase_schema.sql');
  console.log('3. Salin SUPABASE_URL dan SUPABASE_KEY (anon/service_role) ke file .env Anda:');
  console.log('   DB_TYPE=supabase');
  console.log('   SUPABASE_URL=https://[YOUR-PROJECT].supabase.co');
  console.log('   SUPABASE_KEY=[YOUR-SUPABASE-ANON-KEY]');
  console.log('4. Jalankan kembali perintah: npm run seed:supabase\n');
}

seed();
