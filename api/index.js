const app = require('../backend/src/server');
const dbManager = require('../backend/src/config/database');
const userModel = require('../backend/src/models/userModel');

let isDbInitialized = false;

module.exports = async (req, res) => {
  if (!isDbInitialized) {
    try {
      await dbManager.init();
      await userModel.ensureDefaultUsers();
      isDbInitialized = true;
    } catch (err) {
      console.error('[Vercel Serverless] Inisialisasi Database Supabase:', err.message);
    }
  }
  return app(req, res);
};

