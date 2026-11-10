const app = require('../backend/src/server');
const dbManager = require('../backend/src/config/database');
const userModel = require('../backend/src/models/userModel');

let isDbInitialized = false;
let initPromise = null;

async function ensureAppInitialized() {
  if (isDbInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await dbManager.init();
        // Inisialisasi default users secara asynchronous tanpa memblokir response
        userModel.ensureDefaultUsers().catch(err => {
          console.warn('[Vercel Serverless] Perhatian ensureDefaultUsers:', err.message);
        });
        isDbInitialized = true;
      } catch (err) {
        console.error('[Vercel Serverless] Gagal inisialisasi Database Supabase:', err.message);
        initPromise = null; // Izinkan retry pada request berikutnya jika ada gangguan jaringan sesaat
      }
    })();
  }
  return initPromise;
}

module.exports = async (req, res) => {
  await ensureAppInitialized();
  return app(req, res);
};
