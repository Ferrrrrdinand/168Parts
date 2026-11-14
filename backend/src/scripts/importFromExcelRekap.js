/**
 * Script Khusus: Impor 400 Produk Terlaris dari Rekap Gabungan Penjualan 168 Parts
 * Sumber: f:\Save VS Code\marketplace\Produk\Rekap_Gabungan_Penjualan_2024-2026.xlsx
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const dbManager = require('../config/database');

// Gambar representatif berkualitas tinggi per kategori suku cadang & alat servis 168 Parts
const CATEGORY_IMAGES = {
  'Lem LCD I9': [
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80'
  ],
  'Solder Station': [
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&auto=format&fit=crop&q=80'
  ],
  'Alat Servis': [
    'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
  ],
  'Tester & Multitester': [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80'
  ],
  'IC & Chipset': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80'
  ],
  'LCD & Layar': [
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'
  ],
  'Baterai HP': [
    'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80'
  ],
  'Backdoor Kaca': [
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80'
  ]
};

function getCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('lem') || n.includes('glue') || n.includes('uv') || n.includes('remover') || n.includes('lakban')) return 'Lem LCD I9';
  if (n.includes('solder') || n.includes('timah') || n.includes('flux') || n.includes('blower') || n.includes('heating') || n.includes('reballing')) return 'Solder Station';
  if (n.includes('tester') || n.includes('multitester') || n.includes('coil') || n.includes('short') || n.includes('ufi') || n.includes('i2c')) return 'Tester & Multitester';
  if (n.includes('ic ') || n.includes('chip') || n.includes('emmc') || n.includes('nand') || n.includes('qualcomm') || n.includes('cpu')) return 'IC & Chipset';
  if (n.includes('lcd') || n.includes('touchscreen') || n.includes('layar') || n.includes('incell') || n.includes('oled')) return 'LCD & Layar';
  if (n.includes('baterai') || n.includes('battery') || n.includes('mah')) return 'Baterai HP';
  if (n.includes('backdoor') || n.includes('glass camera') || n.includes('tutup belakang') || n.includes('kaca kamera')) return 'Backdoor Kaca';
  if (n.includes('pinset') || n.includes('obeng') || n.includes('tang') || n.includes('ragum') || n.includes('sikat') || n.includes('pisau') || n.includes('clip') || n.includes('botol')) return 'Alat Servis';
  return 'Alat Servis';
}

function generateSlug(name, rank) {
  const clean = String(name || 'produk')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 70);
  return `168-${rank}-${clean}`;
}

function generateShopeeDescription(name, category, variations, rank) {
  const varText = variations && variations.length > 0 
    ? `\n- Varian Tersedia: ${variations.slice(0, 5).join(', ')}`
    : '';

  return `SELAMAT DATANG DI 168 PARTS SURABAYA
Pusat Grosir & Eceran Sparepart HP, IC Chipset, & Alat Servis Teknisi Terlengkap

NAMA PRODUK:
${name}

KETERANGAN & DETAIL PRODUK:
- Kategori: ${category}
- Kualitas: 100% Brand New Grade Original (QC Passed oleh teknisi)
- Kondisi: Baru, Tersegel, dan Bebas Cacat Pabrik${varText}
- Cocok digunakan oleh teknisi handphone profesional, konter servis, maupun perbaikan mandiri.

KEUNGGULAN PRODUK:
- Presisi tinggi dengan daya tahan maksimal.
- Komponen teruji stabil dan minim resiko return.
- Produk fast moving dan terlaris di etalase 168 Parts dengan reputasi kepuasan tinggi.

KETENTUAN GARANSI & PENGIRIMAN 168 PARTS:
1. Wajib melakukan tes fungsi barang terlebih dahulu sebelum dipasang permanen (khusus LCD, IC, baterai, dan fleksibel).
2. Garansi berlaku jika segel utuh, plastik pelindung tidak dilepas, dan fisik barang tidak retak / terkena lem berlebih.
3. WAJIB melampirkan rekaman VIDEO UNBOXING utuh tanpa jeda / edit untuk keperluan klaim jika terjadi kendala isi paket.
4. Setiap pesanan dikemas ekstra aman menggunakan Bubble Wrap tebal dan kotak kardus khusus toko.
5. Pengiriman cepat langsung dari gudang toko fisik kami di Kota Surabaya. Pesanan sebelum jam 17.00 WIB dikirim di hari yang sama!

Terima kasih telah berbelanja di 168 Parts Surabaya. Kepuasan dan kelancaran servis Anda adalah prioritas kami!`.trim();
}

async function run() {
  console.log('========================================================');
  console.log('🚀 168 Parts - Migrasi 400 Produk Terlaris Shopee 168part');
  console.log('========================================================');

  const excelPath = path.resolve('f:/Save VS Code/marketplace/Produk/Rekap_Gabungan_Penjualan_2024-2026.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('❌ File Excel tidak ditemukan:', excelPath);
    process.exit(1);
  }

  console.log('📂 Membaca file:', excelPath);
  const wb = xlsx.readFile(excelPath);
  const rankingRows = xlsx.utils.sheet_to_json(wb.Sheets['Ranking Seluruh Produk']);
  const txRows = xlsx.utils.sheet_to_json(wb.Sheets['Data Transaksi Gabungan']);

  console.log(`📊 Total produk terdata: ${rankingRows.length} produk`);
  console.log(`📑 Total riwayat transaksi: ${txRows.length} baris`);

  // Build price and variations map
  const priceMap = new Map();
  const varMap = new Map();

  for (const r of txRows) {
    const name = (r['Nama Produk'] || '').trim();
    if (!name) continue;

    let priceStr = String(r['Harga Setelah Diskon'] || r['Harga Awal'] || '0').replace(/[^0-9]/g, '');
    let price = parseInt(priceStr, 10) || 0;

    if (!priceMap.has(name) || (price > 0 && priceMap.get(name) === 0)) {
      priceMap.set(name, price);
    }

    if (r['Nama Variasi']) {
      if (!varMap.has(name)) varMap.set(name, new Set());
      varMap.get(name).add(r['Nama Variasi'].trim());
    }
  }

  // Ambil TOP 400 Produk Terlaris
  const TOP_LIMIT = 400;
  const products = [];

  for (let i = 0; i < Math.min(TOP_LIMIT, rankingRows.length); i++) {
    const row = rankingRows[i];
    const rank = i + 1;
    const name = (row['Nama Produk'] || '').trim();
    const sold = Math.max(1, Number(row['Unit Terjual Bersih'] || 0));

    let price = priceMap.get(name) || 0;
    if (price === 0) {
      price = 35000; // Fallback jika tidak tercatat nominal
    }

    // Hitung original price (sebelum diskon)
    const discountPercent = rank <= 30 ? 25 : (rank <= 100 ? 20 : 15);
    const originalPrice = Math.round(price / (1 - (discountPercent / 100)));

    const category = getCategory(name);
    const variations = varMap.has(name) ? Array.from(varMap.get(name)) : [];

    const imgList = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Alat Servis'];
    const image = imgList[(rank - 1) % imgList.length];

    const isFlashSale = rank <= 12;
    const flashSaleSold = isFlashSale ? Math.min(sold, Math.floor(sold * 0.4) + 10) : 0;
    const rating = Number((4.8 + ((rank % 3) * 0.1)).toFixed(1)); // 4.8, 4.9, 5.0
    const stock = Math.max(15, Math.min(500, Math.floor(sold * 0.6) + 20));

    const productObj = {
      id: `168-p${rank}`,
      name: name,
      slug: generateSlug(name, rank),
      category: category,
      price: price,
      originalPrice: originalPrice,
      discountPercent: discountPercent,
      rating: rating,
      soldCount: sold,
      stock: stock,
      location: 'Kota Surabaya',
      shopName: '168 Parts Surabaya',
      shopType: 'Star+',
      icon: 'bag',
      image: image,
      bgPattern: '#f8fafc',
      isFlashSale: isFlashSale,
      flashSaleSold: flashSaleSold,
      description: generateShopeeDescription(name, category, variations, rank),
      specs: [
        `Kategori: ${category}`,
        `Kondisi: 100% Baru & Tersegel`,
        `Kualitas: Grade Original 168 Parts`,
        `Asal Toko: Kota Surabaya`,
        `Garansi: Garansi Tes 7 Hari (Segel Utuh)`
      ]
    };

    products.push(productObj);
  }

  console.log(`✨ Berhasil menyusun data 400 produk terlaris 168 Parts.`);

  // Simpan ke file seedProducts.js agar tersimpan permanen di codebase
  const seedFilePath = path.resolve('f:/Save VS Code/marketplace/backend/data/seedProducts.js');
  const fileContent = `// Katalog Resmi 400 Produk Terlaris Shopee 168 Parts Surabaya
// Dihasilkan dari Rekap Gabungan Penjualan 2024-2026
module.exports = ${JSON.stringify(products, null, 2)};
`;
  fs.writeFileSync(seedFilePath, fileContent, 'utf8');
  console.log(`💾 File ${seedFilePath} berhasil diperbarui dengan 400 produk!`);

  // Hubungkan ke Supabase Cloud PostgreSQL
  console.log('⚡ Menghubungkan ke Supabase Cloud PostgreSQL...');
  await dbManager.init();

  console.log('🗑️ Mengosongkan data katalog produk lama di Supabase...');
  await dbManager.query('DELETE FROM products');

  console.log(`📥 Memasukkan ${products.length} produk ke Supabase Cloud...`);
  let successCount = 0;

  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    const sql = `
      INSERT INTO products (
        id, name, slug, category, price, original_price, discount_percent,
        rating, sold_count, stock, location, shop_name, shop_type,
        icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        category = excluded.category,
        price = excluded.price,
        original_price = excluded.original_price,
        discount_percent = excluded.discount_percent,
        rating = excluded.rating,
        sold_count = excluded.sold_count,
        stock = excluded.stock,
        image = excluded.image,
        description = excluded.description,
        specs = excluded.specs;
    `;

    try {
      await dbManager.query(sql, [
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
        p.isFlashSale,
        p.flashSaleSold,
        p.description,
        JSON.stringify(p.specs)
      ]);
      successCount++;
      if (successCount % 50 === 0 || successCount === products.length) {
        console.log(`  -> Berhasil menyimpan ${successCount}/${products.length} produk...`);
      }
    } catch (err) {
      console.error(`❌ Gagal menyimpan ${p.id} (${p.name}):`, err.message);
    }
  }

  // Verifikasi jumlah akhir di database
  const finalCount = await dbManager.query('SELECT COUNT(*) as count FROM products');
  console.log('========================================================');
  console.log(`🎉 SUKSES! Total produk di Database Supabase: ${finalCount[0].count} produk.`);
  console.log('========================================================');
}

run()
  .catch(err => {
    console.error('❌ Error migrasi:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
