const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../../data/pasarin_local.db');
const db = new sqlite3.Database(dbPath);

const products168 = [
  {
    id: '168part-1',
    name: 'Lem LCD Touchscreen & Backdoor LANRUI I9 55ml Original',
    slug: 'lem-lcd-touchscreen-backdoor-lanrui-i9-55ml',
    category: 'HP & Aksesoris',
    price: 25000,
    original_price: 35000,
    discount_percent: 29,
    rating: 4.9,
    sold_count: 480,
    stock: 150,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'tool',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f1f5f9',
    is_flash_sale: 1,
    flash_sale_sold: 45,
    description: 'Lem perekat khusus touchscreen LCD dan backdoor frame casing smartphone merk LANRUI I9 55ml. Kuat, elastis, mudah dibersihkan, dan tidak merusak LCD.',
    specs: JSON.stringify(['Volume: 55ml', 'Tipe: Bening / Clear Elastis', 'Aplikasi: LCD, Touchscreen, Backdoor', 'Kualitas: 100% Original'])
  },
  {
    id: '168part-2',
    name: 'IC Chip Charger Universal Fast Charging IC Power Smartphone',
    slug: 'ic-chip-charger-universal-fast-charging',
    category: 'HP & Aksesoris',
    price: 25000,
    original_price: 35000,
    discount_percent: 29,
    rating: 4.8,
    sold_count: 230,
    stock: 90,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'chip',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f8fafc',
    is_flash_sale: 0,
    flash_sale_sold: 0,
    description: 'IC chip charger modul universal untuk perbaikan handphone yang tidak bisa mengisi daya atau pengisian lambat. Kompatibel dengan berbagai tipe motherboard Android.',
    specs: JSON.stringify(['Tipe: IC Charger Universal', 'Kompatibilitas: Android All Brand', 'Kondisi: New Original Test Passed'])
  },
  {
    id: '168part-3',
    name: 'Pisau Penghilang Lem Glue CPU JTXTOOLS CK-2 Ultra Thin',
    slug: 'pisau-penghilang-lem-glue-cpu-jtxtools-ck2',
    category: 'Elektronik',
    price: 50000,
    original_price: 65000,
    discount_percent: 23,
    rating: 5.0,
    sold_count: 310,
    stock: 65,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'tool',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f1f5f9',
    is_flash_sale: 1,
    flash_sale_sold: 28,
    description: 'Pisau scrap mata pisau tipis fleksibel JTXTOOLS CK-2 khusus teknisi untuk membersihkan lem sisa CPU, IC eMMC, dan lem frame tanpa menggores PCB board.',
    specs: JSON.stringify(['Merek: JTXTOOLS CK-2', 'Bahan: Stainless Steel Lentur', 'Fungsi: Pembersih Lem IC & CPU'])
  },
  {
    id: '168part-4',
    name: 'Penjepit PCB & IC Clamp Holder YAXUN A40 High Precision',
    slug: 'penjepit-pcb-ic-clamp-holder-yaxun-a40',
    category: 'Elektronik',
    price: 65000,
    original_price: 85000,
    discount_percent: 24,
    rating: 4.9,
    sold_count: 195,
    stock: 40,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'tool',
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f8fafc',
    is_flash_sale: 0,
    flash_sale_sold: 0,
    description: 'Ragum penjepit motherboard PCB dan IC smartphone merk YAXUN A40. Tahan panas solder, anti statis, presisi tinggi untuk teknisi handphone profesional.',
    specs: JSON.stringify(['Merek: YAXUN A40', 'Material: Sintetis Tahan Panas & Baja', 'Fitur: Penjepit IC Ganda'])
  },
  {
    id: '168part-5',
    name: 'Cairan Flux Solder MR.FLUX 01 2UUL High Grade No-Clean 10cc',
    slug: 'cairan-flux-solder-mrflux-01-2uul',
    category: 'Elektronik',
    price: 66000,
    original_price: 80000,
    discount_percent: 18,
    rating: 4.9,
    sold_count: 520,
    stock: 85,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'tool',
    image: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80532e?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f1f5f9',
    is_flash_sale: 1,
    flash_sale_sold: 60,
    description: 'Flux pasta solder premium 2UUL MR.FLUX 01 untuk reballing IC, soldering SMD, dan penghantar panas timah terbaik tanpa asap pekat dan tidak korosif.',
    specs: JSON.stringify(['Merek: 2UUL MR.FLUX 01', 'Isi: 10cc Spuit Jarum', 'Formula: Halogen Free & No Clean'])
  },
  {
    id: '168part-6',
    name: 'JTX Short Circuit Finder Pad IR3 Alat Detektor Korsleting HP',
    slug: 'jtx-short-circuit-finder-pad-ir3',
    category: 'Elektronik',
    price: 189000,
    original_price: 235000,
    discount_percent: 20,
    rating: 5.0,
    sold_count: 140,
    stock: 30,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'tool',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f8fafc',
    is_flash_sale: 0,
    flash_sale_sold: 0,
    description: 'Alat pendeteksi jalur korsleting / short circuit pada motherboard ponsel dengan sensor thermal pad instan. Membantu teknisi menemukan komponen yang panas/rusak dalam hitungan detik.',
    specs: JSON.stringify(['Merek: JTX IR3', 'Tipe: Thermal Detection Pad', 'Akurasi: Realtime Heat Sensor'])
  },
  {
    id: '168part-7',
    name: 'Solder Station Digital WEMON K21A C210 Fast Heating 75W',
    slug: 'solder-station-digital-wemon-k21a-c210',
    category: 'Elektronik',
    price: 500000,
    original_price: 650000,
    discount_percent: 23,
    rating: 5.0,
    sold_count: 88,
    stock: 25,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'tool',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f1f5f9',
    is_flash_sale: 1,
    flash_sale_sold: 12,
    description: 'Solder station cerdas digital WEMON K21A support mata solder seri C210. Pemanasan kilat 2 detik mencapai 350°C dengan fitur sleep mode otomatis dan pengaturan suhu presisi.',
    specs: JSON.stringify(['Daya: 75 Watt', 'Waktu Pemanasan: 2 Detik', 'Mata Solder: C210 Series', 'Suhu: 100°C - 450°C'])
  },
  {
    id: '168part-8',
    name: 'Backdoor Casing Belakang Samsung Galaxy A50 A505 Original OEM',
    slug: 'backdoor-casing-samsung-galaxy-a50',
    category: 'HP & Aksesoris',
    price: 19000,
    original_price: 28000,
    discount_percent: 32,
    rating: 4.8,
    sold_count: 670,
    stock: 120,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'phone',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f8fafc',
    is_flash_sale: 1,
    flash_sale_sold: 75,
    description: 'Tutup casing belakang / backdoor pengganti untuk Samsung Galaxy A50. Bahan presisi dilengkapi lem perekat bawaan dan kaca lensa kamera.',
    specs: JSON.stringify(['Tipe HP: Samsung Galaxy A50 (SM-A505)', 'Include: Lem Adhesive & Kaca Kamera', 'Warna: Hitam / Biru / Putih'])
  },
  {
    id: '168part-9',
    name: 'Backdoor Tutup Belakang Vivo Y12 / Y15 / Y17 Full Set Kamera',
    slug: 'backdoor-vivo-y12-y15-y17',
    category: 'HP & Aksesoris',
    price: 20000,
    original_price: 30000,
    discount_percent: 33,
    rating: 4.9,
    sold_count: 810,
    stock: 110,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'phone',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f8fafc',
    is_flash_sale: 0,
    flash_sale_sold: 0,
    description: 'Casing tutup belakang backdoor untuk Vivo Y12 / Y15 / Y17. Presisi pas dengan warna kilau original dan include kaca kamera.',
    specs: JSON.stringify(['Tipe HP: Vivo Y12, Y15, Y17', 'Kondisi: 100% Baru Presisi OEM', 'Fitur: Lengkap Lensa Kamera'])
  },
  {
    id: '168part-10',
    name: 'LCD Touchscreen Samsung Galaxy J7 2016 J710 OLED Original',
    slug: 'lcd-touchscreen-samsung-galaxy-j7-2016-oled',
    category: 'HP & Aksesoris',
    price: 340000,
    original_price: 420000,
    discount_percent: 19,
    rating: 4.9,
    sold_count: 290,
    stock: 35,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'phone',
    image: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80532e?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f1f5f9',
    is_flash_sale: 1,
    flash_sale_sold: 18,
    description: 'Layar panel LCD Touchscreen assembly Samsung Galaxy J7 2016 (SM-J710F) tipe OLED kontras tinggi, sentuhan responsif, dan support pengaturan kecerahan layar.',
    specs: JSON.stringify(['Tipe Layar: OLED Original', 'Ukuran: 5.5 inci', 'Kecerahan: Adjustable Brightness', 'Garansi: Garansi Tes 7 Hari'])
  },
  {
    id: '168part-11',
    name: 'Baterai Original OEM W09 Pro Oss Team V3 High Capacity',
    slug: 'baterai-original-oem-w09-pro-oss-team-v3',
    category: 'HP & Aksesoris',
    price: 499000,
    original_price: 599000,
    discount_percent: 17,
    rating: 5.0,
    sold_count: 65,
    stock: 20,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'battery',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f8fafc',
    is_flash_sale: 0,
    flash_sale_sold: 0,
    description: 'Baterai sparepart premium OSS TEAM W09 Pro V3 high capacity dengan proteksi IC ganda anti kembung dan daya tahan maksimal untuk perbaikan smartphone.',
    specs: JSON.stringify(['Merek: OSS TEAM W09 Pro V3', 'Kapasitas: High Capacity Real', 'Proteksi: Dual IC Protection'])
  },
  {
    id: '168part-12',
    name: 'Plat BGA Reballing Magnet Set CPU & Power IC Universal',
    slug: 'plat-bga-reballing-magnet-set-cpu-power-ic',
    category: 'Elektronik',
    price: 85000,
    original_price: 110000,
    discount_percent: 23,
    rating: 4.9,
    sold_count: 210,
    stock: 55,
    location: 'Kota Surabaya',
    shop_name: '168part Surabaya',
    shop_type: 'Star',
    icon: 'tool',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
    bg_pattern: '#f1f5f9',
    is_flash_sale: 0,
    flash_sale_sold: 0,
    description: 'Plat cetak timah BGA stencil universal magnetik untuk cetak ulang kaki IC CPU Snapdragon, MediaTek, dan Power IC dengan ketebalan presisi anti melengkung.',
    specs: JSON.stringify(['Material: Plat Baja Magnetik Anti Panas', 'Dukungan: Snapdragon, MediaTek, Exynos', 'Presisi: 0.12mm CNC Cut'])
  }
];

// 1. Insert ke SQLite
const insertSQL = `
  INSERT OR REPLACE INTO products (
    id, name, slug, category, price, original_price, discount_percent,
    rating, sold_count, stock, location, shop_name, shop_type,
    icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

db.serialize(() => {
  const stmt = db.prepare(insertSQL);
  for (const p of products168) {
    stmt.run([
      p.id, p.name, p.slug, p.category, p.price, p.original_price, p.discount_percent,
      p.rating, p.sold_count, p.stock, p.location, p.shop_name, p.shop_type,
      p.icon, p.image, p.bg_pattern, p.is_flash_sale, p.flash_sale_sold, p.description, p.specs
    ]);
  }
  stmt.finalize((err) => {
    if (err) console.error('Error insert SQLite:', err);
    else console.log('✅ Berhasil memasukkan ' + products168.length + ' produk dari 168part Shopee ke SQLite!');
    db.close();
  });
});

// 2. Update juga backend/data/db.json
const jsonPath = path.resolve(__dirname, '../../data/db.json');
if (fs.existsSync(jsonPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!data.products) data.products = [];
    for (const p of products168) {
      const idx = data.products.findIndex(x => x.id === p.id);
      const jsonItem = {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        price: p.price,
        originalPrice: p.original_price,
        discountPercent: p.discount_percent,
        rating: p.rating,
        soldCount: p.sold_count,
        stock: p.stock,
        location: p.location,
        shopName: p.shop_name,
        shopType: p.shop_type,
        icon: p.icon,
        image: p.image,
        bgPattern: p.bg_pattern,
        isFlashSale: Boolean(p.is_flash_sale),
        flashSaleSold: p.flash_sale_sold,
        description: p.description,
        specs: JSON.parse(p.specs)
      };
      if (idx >= 0) {
        data.products[idx] = jsonItem;
      } else {
        data.products.unshift(jsonItem);
      }
    }
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ Berhasil menyinkronkan 168part Shopee ke backend/data/db.json!');
  } catch (e) {
    console.error('Error update db.json:', e);
  }
}

