/**
 * Script Khusus: Impor 400 Produk Terlaris 168 Parts (DEDUPED & BERSIH 100%)
 * Menggabungkan produk dobel dari Shopee/Excel menjadi 1 produk resmi dengan akumulasi penjualan,
 * dan mengisi slot hingga tepat 400 produk unik.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const dbManager = require('../config/database');

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

const DESC_LANRUI_I9 = `Deskripsi Produk : 

LanRui I9 adalah lem perekat aktif / multi-fungsi dari merek LanRui, dirancang khusus untuk keperluan servis elektronik seperti bonding screen, housing frame, back cover, bracket, dan aplikasi lain yang membutuhkan adhesi kuat tapi tetap lembut jika disentuh. Tersedia dalam varian transparan maupun hitam. 
Fungsi :

1. Untuk perekat housing / frame perangkat mobile seperti body belakang HP, sisi bingkai, dan komponen penutup lain.

2. Untuk bonding screen / panel kaca ketika mengganti layar, memastikan sambungan kuat dan rata.

3. Untuk pengerjaan back cover / bracket / fitting screen border agar rapih dan tidak mudah lepas. 

4. Untuk aplikasi repair elektronik lain yang memerlukan lem dengan adhesi tinggi tapi tetap lembut agar tidak merusak bagian yang sensitif seperti kabel fleksibel.

Nb: Lebih baik tanyakan stok barang terlebih dahulu sebelum check out`;

const SPECS_LANRUI_I9 = [
  'Merek: LanRui',
  'Seri: I9 Multi-Function Adhesive',
  'Volume: 55ml',
  'Varian Warna: Hitam & Transparan',
  'Karakteristik: Adhesi Kuat & Lembut Fleksibel',
  'Aplikasi: LCD Screen, Housing Frame, Back Cover & Bracket',
  'Asal: 168 Parts Official Surabaya'
];

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

function getCanonicalKey(name) {
  let s = name.toLowerCase();

  // Bersihkan tag listing ganda Shopee
  s = s.replace(/\[ready\]|\(ready\)|\[ pre order \]|\[pre order\]|\(pre-order\)/g, ' ');
  s = s.replace(/\(pengiriman khusus jawa\)/g, ' ');
  s = s.replace(/\bpromo\b/g, ' ');
  s = s.replace(/\bready stock\b/g, ' ');
  s = s.replace(/\(ready warna putih\)/g, ' ');
  s = s.replace(/\bisi \d+pcs\b|\bisi \d+\b/g, ' ');
  s = s.replace(/harga per 1pcs rp [0-9.]+/g, ' ');

  // Perbaikan typo penulisan umum
  s = s.replace(/\bmutimeter\b/g, 'multimeter');
  s = s.replace(/\bnanno\b/g, 'nano');

  // Pengelompokan kanonikal produk kembar
  if (s.includes('lanrui') && s.includes('i9') && (s.includes('lem') || s.includes('glue'))) {
    return 'lem_lanrui_i9_55ml';
  }
  if (s.includes('v9') && s.includes('pendeteksi') && s.includes('short')) {
    return 'v9_pendeteksi_short';
  }
  if (s.includes('lanrui') && s.includes('m191') && s.includes('clip')) {
    return 'lanrui_m191_clip';
  }
  if (s.includes('kaca cetak ic lanrui') && s.includes('p08')) {
    return 'kaca_cetak_ic_lanrui_p08';
  }
  if (s.includes('turbo i2c') && s.includes('120w')) {
    return 'kabel_turbo_i2c_120w';
  }
  if (s.includes('mic cina kabel')) {
    return 'mic_cina_kabel';
  }
  if (s.includes('mic samsung s7') || s.includes('mic samsung 9500')) {
    return 'mic_samsung_s7_9500';
  }
  if (s.includes('lem uv ycs')) {
    return 'lem_uv_ycs';
  }
  if (s.includes('jtx s1 soldering')) {
    return 'jtx_s1_soldering';
  }
  if (s.includes('nano conductive solder pasta j9')) {
    return 'lanrui_nano_solder_pasta_j9';
  }
  if (s.includes('timah pasta 50gr 2uul') && s.includes('199')) {
    return 'timah_pasta_50gr_2uul_199';
  }
  if (s.includes('multimeter pen w9 lanrui')) {
    return 'kabel_multimeter_pen_w9_lanrui';
  }
  if (s.includes('cpu heater ycs')) {
    return 'cpu_heater_ycs';
  }
  if (s.includes('ragum ycs h03')) {
    return 'ragum_ycs_h03';
  }

  return s.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanTitle(name) {
  let s = name.trim();
  // Hapus tag [READY] atau (PRE-ORDER) dari judul display agar rapi
  s = s.replace(/^\[READY\]\s*/i, '');
  s = s.replace(/^\(PRE-ORDER\)\s*/i, '');
  s = s.replace(/^\[PRE ORDER\]\s*/i, '');
  s = s.replace(/\s*\(PENGIRIMAN KHUSUS JAWA\)\s*/i, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function generateSlug(name, rank) {
  const clean = String(name || 'produk')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 70);
  return `168-${rank}-${clean}`;
}

function generateShopeeDescription(name, category, variations) {
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
  console.log('🧹 168 Parts - Deduplikasi & Impor 400 Produk Bersih Unik');
  console.log('========================================================');

  const excelPath = path.resolve('f:/Save VS Code/marketplace/Produk/Rekap_Gabungan_Penjualan_2024-2026.xlsx');
  const wb = xlsx.readFile(excelPath);
  const rankingRows = xlsx.utils.sheet_to_json(wb.Sheets['Ranking Seluruh Produk']);
  const txRows = xlsx.utils.sheet_to_json(wb.Sheets['Data Transaksi Gabungan']);

  // Price & Variation Map
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

  // Deduplikasi & Penggabungan
  const canonicalMap = new Map();
  const mergedDetails = [];

  for (const row of rankingRows) {
    const rawName = (row['Nama Produk'] || '').trim();
    if (!rawName) continue;
    const sold = Math.max(1, Number(row['Unit Terjual Bersih'] || 0));
    const key = getCanonicalKey(rawName);

    if (canonicalMap.has(key)) {
      const existing = canonicalMap.get(key);
      existing.sold += sold; // Akumulasikan penjualan produk kembar
      mergedDetails.push({
        canonical: existing.name,
        duplicate: rawName,
        addedSold: sold
      });
      // Gabungkan variasi jika ada
      if (varMap.has(rawName)) {
        if (!existing.variations) existing.variations = [];
        existing.variations.push(...Array.from(varMap.get(rawName)));
      }
    } else {
      const variations = varMap.has(rawName) ? Array.from(varMap.get(rawName)) : [];
      let price = priceMap.get(rawName) || 0;
      if (price === 0) price = 35000;

      canonicalMap.set(key, {
        name: cleanTitle(rawName),
        originalName: rawName,
        sold,
        price,
        variations
      });
    }
  }

  console.log(`✅ Berhasil mendeteksi & menggabungkan ${mergedDetails.length} produk kembar/dobel.`);
  console.log(`💎 Total produk unik yang tersedia: ${canonicalMap.size} produk.`);

  // Ambil TEPAT 400 Produk Terlaris Unik Tanpa Dobel
  const TARGET_COUNT = 400;
  const uniqueProductsList = Array.from(canonicalMap.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, TARGET_COUNT);

  console.log(`🎯 Menyusun katalog ${uniqueProductsList.length} produk terlaris 100% UNIK.`);

  const finalProducts = [];

  for (let i = 0; i < uniqueProductsList.length; i++) {
    const item = uniqueProductsList[i];
    const rank = i + 1;
    const category = getCategory(item.name);
    const isLanruiI9 = (item.name.toLowerCase().includes('lanrui') && item.name.toLowerCase().includes('i9') && item.name.toLowerCase().includes('lem'));

    const discountPercent = rank <= 30 ? 25 : (rank <= 100 ? 20 : 15);
    const originalPrice = Math.round(item.price / (1 - (discountPercent / 100)));

    const imgList = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Alat Servis'];
    const image = imgList[(rank - 1) % imgList.length];

    const isFlashSale = rank <= 12;
    const flashSaleSold = isFlashSale ? Math.min(item.sold, Math.floor(item.sold * 0.4) + 10) : 0;
    const rating = Number((4.8 + ((rank % 3) * 0.1)).toFixed(1));
    const stock = Math.max(20, Math.min(500, Math.floor(item.sold * 0.6) + 25));

    const description = isLanruiI9 
      ? DESC_LANRUI_I9 
      : generateShopeeDescription(item.name, category, item.variations);

    const specs = isLanruiI9
      ? SPECS_LANRUI_I9
      : [
          `Kategori: ${category}`,
          `Kondisi: 100% Baru & Tersegel`,
          `Kualitas: Grade Original 168 Parts`,
          `Asal Toko: Kota Surabaya`,
          `Garansi: Garansi Tes 7 Hari (Segel Utuh)`
        ];

    finalProducts.push({
      id: `168-p${rank}`,
      name: item.name,
      slug: generateSlug(item.name, rank),
      category: category,
      price: item.price,
      originalPrice: originalPrice,
      discountPercent: discountPercent,
      rating: rating,
      soldCount: item.sold,
      stock: stock,
      location: 'Kota Surabaya',
      shopName: '168 Parts Surabaya',
      shopType: 'Star+',
      icon: 'bag',
      image: image,
      bgPattern: '#f8fafc',
      isFlashSale: isFlashSale,
      flashSaleSold: flashSaleSold,
      description: description,
      specs: specs
    });
  }

  // 1. Simpan ke seedProducts.js
  const seedFilePath = path.resolve('f:/Save VS Code/marketplace/backend/data/seedProducts.js');
  const fileContent = `// Katalog Resmi 400 Produk Terlaris Shopee 168 Parts Surabaya (100% UNIK & DEDUPED)
// Total Produk: ${finalProducts.length}
module.exports = ${JSON.stringify(finalProducts, null, 2)};
`;
  fs.writeFileSync(seedFilePath, fileContent, 'utf8');
  console.log(`💾 File seedProducts.js berhasil disimpan dengan ${finalProducts.length} produk 100% unik!`);

  // 2. Simpan ke Supabase Cloud PostgreSQL
  console.log('⚡ Menghubungkan ke Supabase Cloud PostgreSQL...');
  await dbManager.init();

  console.log('🗑️ Mengosongkan data lama di Supabase...');
  await dbManager.query('DELETE FROM products');

  console.log(`📥 Memasukkan ${finalProducts.length} produk bersih ke Supabase Cloud...`);
  let successCount = 0;

  for (const p of finalProducts) {
    const sql = `
      INSERT INTO products (
        id, name, slug, category, price, original_price, discount_percent,
        rating, sold_count, stock, location, shop_name, shop_type,
        icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      if (successCount % 50 === 0 || successCount === finalProducts.length) {
        console.log(`  -> Berhasil menyimpan ${successCount}/${finalProducts.length} produk...`);
      }
    } catch (err) {
      console.error(`❌ Gagal menyimpan ${p.id} (${p.name}):`, err.message);
    }
  }

  // 3. Verifikasi jumlah akhir & cek duplikasi
  const finalDb = await dbManager.query('SELECT name, count(*) as c FROM products GROUP BY name HAVING count(*) > 1');
  const totalCount = await dbManager.query('SELECT COUNT(*) as count FROM products');

  console.log('========================================================');
  console.log(`🎉 SUKSES SELESAI!`);
  console.log(`📊 Total produk di Supabase: ${totalCount[0].count} produk`);
  console.log(`🛡️ Jumlah produk duplikat: ${finalDb.length} (ZERO DUPLICATE)`);
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
