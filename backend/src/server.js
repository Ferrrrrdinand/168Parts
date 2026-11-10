const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const dbManager = require('./config/database');
const userModel = require('./models/userModel');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const promoRoutes = require('./routes/promoRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

const app = express();

// Middleware dasar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger sederhana
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes - Dukung baik prefix /api maupun langsung (untuk kompatibilitas Vercel Serverless Function & Standalone)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/products', '/products'], productRoutes);
app.use(['/api/cart', '/cart'], cartRoutes);
app.use(['/api/orders', '/orders'], orderRoutes);
app.use(['/api/promos', '/promos'], promoRoutes);
app.use(['/api/banners', '/banners'], bannerRoutes);

// Health check endpoint dengan pengujian koneksi database Supabase nyata
app.get(['/api/health', '/health', '/api/health/db', '/health/db'], async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbMessage = 'Database belum terhubung';
  let dbName = 'postgres';
  let latencyMs = 0;
  let errorDetail = null;

  try {
    const dbRes = await dbManager.query('SELECT NOW() as now, current_database() as db_name');
    latencyMs = Date.now() - startTime;
    if (dbRes && dbRes.length > 0) {
      dbStatus = 'connected';
      dbName = dbRes[0].db_name || 'postgres';
      dbMessage = `Supabase PostgreSQL Cloud (${dbName}) terhubung`;
    }
  } catch (err) {
    latencyMs = Date.now() - startTime;
    dbStatus = 'disconnected';
    dbMessage = err.message || 'Gagal koneksi database';
    errorDetail = dbManager.lastError || { message: err.message, code: err.code };
  }

  const isHealthy = dbStatus === 'connected';

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    database: {
      status: dbStatus,
      type: 'supabase',
      connected: isHealthy,
      databaseName: dbName,
      message: dbMessage,
      latencyMs,
      error: errorDetail
    },
    timestamp: new Date().toISOString(),
    service: '168 Parts Surabaya Backend API'
  });
});

// Melayani Frontend Utama (Original Design dengan Tema Soft Red 168 Parts)
// Serta menyediakan akses ke React Vite App di /react
const fs = require('fs');
const reactDistPath = path.resolve(__dirname, '../../frontend-react/dist');
const legacyFrontendPath = path.resolve(__dirname, '../../frontend');

// Support React Vite di /react
if (fs.existsSync(reactDistPath)) {
  app.use('/react', express.static(reactDistPath));
}

// Melayani Original Design sebagai frontend default
app.use(express.static(legacyFrontendPath));

// Fallback router untuk SPA & Static HTML
app.use((req, res, next) => {
  const url = req.originalUrl || req.url || '';
  if (url.startsWith('/api') || url.startsWith('/auth') || url.startsWith('/products') || url.startsWith('/cart') || url.startsWith('/orders') || url.startsWith('/promos') || url.startsWith('/banners')) {
    return res.status(404).json({
      success: false,
      message: `Endpoint API ${req.method} ${url} tidak ditemukan.`
    });
  }
  if (url.startsWith('/react') && fs.existsSync(reactDistPath)) {
    return res.sendFile(path.join(reactDistPath, 'index.html'));
  }
  res.sendFile(path.join(legacyFrontendPath, 'index.html'));
});

// Start Server & Database (Hanya saat standalone server: node backend/src/server.js)
const PORT = config.port;
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log('====================================================');
    console.log(`🚀 168 Parts Backend Server berjalan di port ${PORT}`);
    console.log(`🌐 Website Frontend: http://localhost:${PORT}`);
    console.log(`🔐 Halaman Login:    http://localhost:${PORT}/login.html`);
    console.log(`📡 API Base URL:     http://localhost:${PORT}/api`);
    console.log('====================================================');
    await dbManager.init();
    await userModel.ensureDefaultUsers();
  });
}

module.exports = app;
