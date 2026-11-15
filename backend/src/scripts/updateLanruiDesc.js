require('dotenv').config();
const fs = require('fs');
const path = require('path');
const dbManager = require('../config/database');

const descI9 = `Deskripsi Produk : 

LanRui I9 adalah lem perekat aktif / multi-fungsi dari merek LanRui, dirancang khusus untuk keperluan servis elektronik seperti bonding screen, housing frame, back cover, bracket, dan aplikasi lain yang membutuhkan adhesi kuat tapi tetap lembut jika disentuh. Tersedia dalam varian transparan maupun hitam. 
Fungsi :

1. Untuk perekat housing / frame perangkat mobile seperti body belakang HP, sisi bingkai, dan komponen penutup lain.

2. Untuk bonding screen / panel kaca ketika mengganti layar, memastikan sambungan kuat dan rata.

3. Untuk pengerjaan back cover / bracket / fitting screen border agar rapih dan tidak mudah lepas. 

4. Untuk aplikasi repair elektronik lain yang memerlukan lem dengan adhesi tinggi tapi tetap lembut agar tidak merusak bagian yang sensitif seperti kabel fleksibel.

Nb: Lebih baik tanyakan stok barang terlebih dahulu sebelum check out`;

const specsI9 = [
  'Merek: LanRui',
  'Seri: I9 Multi-Function Adhesive',
  'Volume: 55ml',
  'Varian Warna: Hitam & Transparan',
  'Karakteristik: Adhesi Kuat & Lembut Fleksibel',
  'Aplikasi: LCD Screen, Housing Frame, Back Cover & Bracket',
  'Asal: 168 Parts Official Surabaya'
];

async function update() {
  console.log('⚡ Memperbarui deskripsi produk LanRui I9...');

  // 1. Update seedProducts.js
  const seedPath = path.resolve(__dirname, '../../data/seedProducts.js');
  const products = require(seedPath);
  let count = 0;
  for (const p of products) {
    if (p.id === '168-p1' || p.id === '168-p2') {
      p.description = descI9;
      p.specs = specsI9;
      console.log(`✅ [seedProducts] Diperbarui: ${p.id} - ${p.name}`);
      count++;
    }
  }
  fs.writeFileSync(seedPath, '// Katalog Resmi 400 Produk Terlaris Shopee 168 Parts Surabaya\nmodule.exports = ' + JSON.stringify(products, null, 2) + ';\n', 'utf8');
  console.log(`💾 File seedProducts.js berhasil disimpan (${count} produk diperbarui).`);

  // 2. Update di Supabase Cloud PostgreSQL
  await dbManager.init();
  await dbManager.query(
    'UPDATE products SET description = ?, specs = ? WHERE id IN (?, ?)',
    [descI9, JSON.stringify(specsI9), '168-p1', '168-p2']
  );
  console.log('🐬 Database Supabase Cloud berhasil diperbarui!');

  // 3. Verifikasi
  const check = await dbManager.query('SELECT id, name, description FROM products WHERE id IN (?, ?)', ['168-p1', '168-p2']);
  for (const c of check) {
    console.log('--------------------------------------------------');
    console.log(`[VERIFIKASI DB] ${c.id}: ${c.name}`);
    console.log(c.description);
  }
}

update()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Gagal update:', e);
    process.exit(1);
  });

