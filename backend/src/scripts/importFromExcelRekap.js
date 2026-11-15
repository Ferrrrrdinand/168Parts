/**
 * Script Khusus: Impor Seluruh Produk 168 Parts dari Rekap Penjualan Shopee 2024-2026
 * - Mencakup seluruh 1.475 produk dari sheet "Ranking Seluruh Produk"
 * - Deduping kanonikal menghasilkan 1.463 produk unik bebas duplikat
 * - Ekstraksi variasi asli (Warna, Model, Suhu, Tipe) dari 15.004 transaksi Shopee
 * - Format LanRui I9 persis screenshot Shopee (Varian Hitam Rp25.000 & Transparan Rp31.000)
 * - Seluruh gambar diset NULL (tanpa gambar sesuai permintaan user)
 * - Batch insert cepat ke Supabase Cloud PostgreSQL
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const dbManager = require('../config/database');

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
  s = s.replace(/\[ready\]|\(ready\)|\[ pre order \]|\[pre order\]|\(pre-order\)/g, ' ');
  s = s.replace(/\(pengiriman khusus jawa\)/g, ' ');
  s = s.replace(/\bpromo\b/g, ' ');
  s = s.replace(/\bready stock\b/g, ' ');
  s = s.replace(/\(ready warna putih\)/g, ' ');
  s = s.replace(/\bisi \d+pcs\b|\bisi \d+\b/g, ' ');
  s = s.replace(/harga per 1pcs rp [0-9.]+/g, ' ');
  s = s.replace(/\bmutimeter\b/g, 'multimeter');
  s = s.replace(/\bnanno\b/g, 'nano');

  if (s.includes('lanrui') && s.includes('i9') && (s.includes('lem') || s.includes('glue'))) return 'lem_lanrui_i9_55ml';
  if (s.includes('v9') && s.includes('pendeteksi') && s.includes('short')) return 'v9_pendeteksi_short';
  if (s.includes('lanrui') && s.includes('m191') && s.includes('clip')) return 'lanrui_m191_clip';
  if (s.includes('kaca cetak ic lanrui') && s.includes('p08')) return 'kaca_cetak_ic_lanrui_p08';
  if (s.includes('turbo i2c') && s.includes('120w')) return 'kabel_turbo_i2c_120w';
  if (s.includes('mic cina kabel')) return 'mic_cina_kabel';
  if (s.includes('mic samsung s7') || s.includes('mic samsung 9500')) return 'mic_samsung_s7_9500';
  if (s.includes('lem uv ycs')) return 'lem_uv_ycs';
  if (s.includes('jtx s1 soldering')) return 'jtx_s1_soldering';
  if (s.includes('nano conductive solder pasta j9')) return 'lanrui_nano_solder_pasta_j9';
  if (s.includes('timah pasta 50gr 2uul') && s.includes('199')) return 'timah_pasta_50gr_2uul_199';
  if (s.includes('multimeter pen w9 lanrui')) return 'kabel_multimeter_pen_w9_lanrui';
  if (s.includes('cpu heater ycs')) return 'cpu_heater_ycs';
  if (s.includes('ragum ycs h03')) return 'ragum_ycs_h03';

  return s.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanTitle(name) {
  let s = name.trim();
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
  return `168-p${rank}-${clean}`;
}

function generateShopeeDescription(name, category, variations) {
  const varText = variations && variations.length > 0 
    ? `\n- Varian Tersedia: ${variations.map(v => v.name || v).join(', ')}`
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
  console.log('💎 168 Parts - Impor SELURUH Produk Excel ke Supabase Cloud');
  console.log('========================================================');

  const excelPath = path.resolve('f:/Save VS Code/marketplace/Produk/Rekap_Gabungan_Penjualan_2024-2026.xlsx');
  const wb = xlsx.readFile(excelPath);
  const rankingRows = xlsx.utils.sheet_to_json(wb.Sheets['Ranking Seluruh Produk']);
  const txRows = xlsx.utils.sheet_to_json(wb.Sheets['Data Transaksi Gabungan']);

  console.log(`📊 Data Ditemukan: ${rankingRows.length} baris ranking produk & ${txRows.length} baris transaksi.`);

  // 1. Ekstrak varian dari transaksi
  const txVarMap = new Map();
  const priceMap = new Map();

  for (const r of txRows) {
    const rawName = (r['Nama Produk'] || '').trim();
    if (!rawName) continue;
    const key = getCanonicalKey(rawName);

    let priceStr = String(r['Harga Setelah Diskon'] || r['Harga Awal'] || '0').replace(/[^0-9]/g, '');
    let price = parseInt(priceStr, 10) || 0;

    if (!priceMap.has(key) || (price > 0 && priceMap.get(key) === 0)) {
      priceMap.set(key, price);
    }

    const vName = (r['Nama Variasi'] || '').trim();
    if (vName && vName.toLowerCase() !== 'standard') {
      if (!txVarMap.has(key)) txVarMap.set(key, new Map());
      const vSubMap = txVarMap.get(key);
      if (!vSubMap.has(vName) || (price > 0 && vSubMap.get(vName) === 0)) {
        vSubMap.set(vName, price);
      }
    }
  }

  // 2. Kelompokkan produk tanpa duplikat
  const canonicalMap = new Map();

  for (const row of rankingRows) {
    const rawName = (row['Nama Produk'] || '').trim();
    if (!rawName) continue;
    const sold = Math.max(1, Number(row['Unit Terjual Bersih'] || 0));
    const key = getCanonicalKey(rawName);

    if (canonicalMap.has(key)) {
      const existing = canonicalMap.get(key);
      existing.sold += sold;
    } else {
      let basePrice = priceMap.get(key) || 0;
      if (basePrice === 0) basePrice = 35000;

      canonicalMap.set(key, {
        name: cleanTitle(rawName),
        originalName: rawName,
        sold,
        price: basePrice,
        key
      });
    }
  }

  // Ambil SEMUA produk unik yang ada di Excel
  const uniqueProductsList = Array.from(canonicalMap.values())
    .sort((a, b) => b.sold - a.sold);

  console.log(`✨ Total Produk Unik Siap Dimasukkan: ${uniqueProductsList.length}`);

  const finalProducts = [];

  for (let i = 0; i < uniqueProductsList.length; i++) {
    const item = uniqueProductsList[i];
    const rank = i + 1;
    const category = getCategory(item.name);
    const isLanruiI9 = (item.key === 'lem_lanrui_i9_55ml' || (item.name.toLowerCase().includes('lanrui') && item.name.toLowerCase().includes('i9')));

    // Extract variants
    let variants = [];
    let basePrice = item.price;

    if (isLanruiI9) {
      item.name = 'LEM LCD TOUCHSCREEN DAN LEM BACKDOOR LANRUI I9 55ML';
      basePrice = 25000;
      variants = [
        { name: 'LANRUI HITAM', price: 25000, stock: 49 },
        { name: 'LANRUI TRANSPARANT', price: 31000, stock: 49 }
      ];
    } else if (txVarMap.has(item.key)) {
      const vSubMap = txVarMap.get(item.key);
      if (vSubMap.size > 0) {
        variants = Array.from(vSubMap.entries()).map(([vName, vPrice]) => ({
          name: vName.toUpperCase(),
          price: vPrice > 0 ? vPrice : item.price,
          stock: Math.max(10, Math.floor(Math.random() * 40) + 15)
        }));
      }
    }

    // Fallback varian jika tidak ada transaksi variasi
    if (variants.length === 0) {
      const raw = item.name;
      const tempMatches = raw.match(/\d+[\u00b0\u2070]?[cC]/g);
      if (tempMatches && tempMatches.length > 1) {
        variants = tempMatches.map(t => ({ name: t, price: item.price, stock: 30 }));
      } else if (raw.includes(';') || (raw.includes('/') && !raw.toLowerCase().includes('lem'))) {
        const parts = raw.split(/[\/;]+/)
          .map(p => p.trim())
          .filter(p => p.length >= 2 && p.length <= 25 && !p.toLowerCase().includes('tombol') && !p.toLowerCase().includes('ready'));
        if (parts.length >= 2 && parts.length <= 6) {
          variants = parts.map(p => ({ name: p.toUpperCase(), price: item.price, stock: 25 }));
        }
      } else {
        const colors = [];
        if (raw.toLowerCase().includes('hitam')) colors.push('HITAM');
        if (raw.toLowerCase().includes('putih')) colors.push('PUTIH');
        if (raw.toLowerCase().includes('transparan') || raw.toLowerCase().includes('transparant')) colors.push('TRANSPARAN');
        if (raw.toLowerCase().includes('biru')) colors.push('BIRU');
        if (colors.length > 1) {
          variants = colors.map(c => ({ name: c, price: item.price, stock: 35 }));
        }
      }
    }

    // Default jika single SKU
    if (variants.length === 0) {
      variants = [{ name: 'STANDAR ORIGINAL', price: basePrice, stock: 45 }];
    }

    const discountPercent = rank <= 30 ? 25 : (rank <= 100 ? 20 : 15);
    const originalPrice = Math.round(basePrice / (1 - (discountPercent / 100)));

    const isFlashSale = rank <= 12;
    const flashSaleSold = isFlashSale ? Math.min(item.sold, Math.floor(item.sold * 0.4) + 10) : 0;
    const rating = isLanruiI9 ? 4.9 : Number((4.7 + ((rank % 4) * 0.1)).toFixed(1));
    const stock = isLanruiI9 ? 49 : Math.max(25, Math.min(500, Math.floor(item.sold * 0.6) + 30));

    const description = isLanruiI9 
      ? DESC_LANRUI_I9 
      : generateShopeeDescription(item.name, category, variants);

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
      price: basePrice,
      originalPrice: originalPrice,
      discountPercent: discountPercent,
      rating: rating,
      soldCount: isLanruiI9 ? 2300 : item.sold,
      stock: stock,
      location: 'Kota Surabaya',
      shopName: '168 Parts Surabaya',
      shopType: 'Star+',
      icon: 'bag',
      image: null, // STRICTLY NULL: Gambar dihapus sesuai instruksi user
      bgPattern: '#f8fafc',
      isFlashSale: isFlashSale,
      flashSaleSold: flashSaleSold,
      description: description,
      specs: specs,
      variants: variants
    });
  }

  // 1. Simpan ke seedProducts.js
  const seedFilePath = path.resolve('f:/Save VS Code/marketplace/backend/data/seedProducts.js');
  fs.writeFileSync(
    seedFilePath,
    `// Katalog Lengkap Seluruh ${finalProducts.length} Produk Shopee 168 Parts Surabaya (Dari Excel Rekap)\nmodule.exports = ` +
      JSON.stringify(finalProducts, null, 2) +
      ';\n',
    'utf8'
  );
  console.log(`💾 seedProducts.js berhasil disimpan dengan ${finalProducts.length} produk + variasi lengkap (Tanpa Gambar)!`);

  // 2. Hubungkan ke Supabase Cloud PostgreSQL
  console.log('⚡ Menghubungkan ke Supabase Cloud PostgreSQL...');
  await dbManager.init();

  console.log('🗑️ Mengosongkan data lama di Supabase...');
  await dbManager.query('DELETE FROM products');

  console.log(`📥 Melakukan batch insert ${finalProducts.length} produk ke Supabase Cloud...`);

  const BATCH_SIZE = 50;
  let insertedTotal = 0;

  for (let i = 0; i < finalProducts.length; i += BATCH_SIZE) {
    const chunk = finalProducts.slice(i, i + BATCH_SIZE);

    // Bangun multi-row insert query
    // Tiap baris: 21 kolom
    const valuePlaceholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const sql = `
      INSERT INTO products (
        id, name, slug, category, price, original_price, discount_percent,
        rating, sold_count, stock, location, shop_name, shop_type,
        icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs, variants
      ) VALUES ${valuePlaceholders}
    `;

    const flatParams = [];
    for (const p of chunk) {
      flatParams.push(
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
        p.image, // null
        p.bgPattern,
        p.isFlashSale,
        p.flashSaleSold,
        p.description,
        JSON.stringify(p.specs),
        JSON.stringify(p.variants)
      );
    }

    await dbManager.query(sql, flatParams);
    insertedTotal += chunk.length;
    console.log(`  -> Berhasil menyimpan batch: ${insertedTotal} / ${finalProducts.length} produk...`);
  }

  console.log('========================================================');
  console.log(`🎉 SUKSES BESAR! Seluruh ${finalProducts.length} Produk + Variasi telah tersimpan di Supabase Cloud.`);
  console.log('========================================================');
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Error migrasi:', err);
      process.exit(1);
    });
}

module.exports = { run, getCategory, getCanonicalKey, cleanTitle };
