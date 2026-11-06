/**
 * CLI Tool: Migrasi Produk Shopee 168part ke Database Pasarin
 * Penggunaan:
 *   node backend/src/scripts/importShopee.js                   -> Seeding katalog 168part default
 *   node backend/src/scripts/importShopee.js data_shopee.xlsx -> Migrasi dari file Excel Seller Centre
 *   node backend/src/scripts/importShopee.js data_shopee.json -> Migrasi dari JSON data Shopee
 *   node backend/src/scripts/importShopee.js --replace        -> Ganti seluruh produk lama
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ShopeeImporter = require('../utils/shopeeImporter');
const seedProducts = require('../../data/seedProducts');

async function main() {
  const args = process.argv.slice(2);
  const replaceExisting = args.includes('--replace');
  const fileArg = args.find(a => !a.startsWith('--'));

  console.log('========================================================');
  console.log('🛒 168Parts - Script Migrasi & Impor Produk Shopee');
  console.log('========================================================');

  let productsToImport = [];

  if (fileArg) {
    const fullPath = path.resolve(process.cwd(), fileArg);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File tidak ditemukan: ${fullPath}`);
      process.exit(1);
    }

    console.log(`📂 Membaca file sumber: ${fullPath}...`);
    const ext = path.extname(fullPath).toLowerCase();

    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      productsToImport = ShopeeImporter.parseFile(fullPath);
      console.log(`📊 Berhasil mem-parsing ${productsToImport.length} baris produk dari file spreadsheet.`);
    } else if (ext === '.json') {
      const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const list = Array.isArray(raw) ? raw : (raw.items || raw.products || raw.data || []);
      productsToImport = list.map((item, idx) => ShopeeImporter.normalizeProduct(item, idx));
      console.log(`📊 Berhasil mem-parsing ${productsToImport.length} produk dari file JSON.`);
    } else {
      console.error(`❌ Format file ${ext} tidak didukung. Gunakan .xlsx, .csv, atau .json.`);
      process.exit(1);
    }
  } else {
    console.log(`🌱 Menggunakan data katalog produk bawaan 168part (${seedProducts.length} produk)...`);
    productsToImport = seedProducts.map((p, idx) => ShopeeImporter.normalizeProduct(p, idx));
  }

  console.log(`⚡ Menyimpan ${productsToImport.length} produk ke database (Replace: ${replaceExisting})...`);
  const result = await ShopeeImporter.saveBatchToDatabase(productsToImport, replaceExisting);

  console.log('========================================================');
  console.log(`✅ ${result.message}`);
  console.log('========================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Terjadi kesalahan migrasi:', err);
  process.exit(1);
});
