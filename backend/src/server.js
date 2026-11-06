const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const dbManager = require('./config/database');

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/banners', bannerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Pasarin Marketplace Backend API'
  });
});

// Melayani Frontend Modern React Vite TSX & Legacy
const fs = require('fs');
const reactDistPath = path.resolve(__dirname, '../../frontend-react/dist');
const legacyFrontendPath = path.resolve(__dirname, '../../frontend');

// Support Legacy static files di /legacy
app.use('/legacy', express.static(legacyFrontendPath));

if (fs.existsSync(reactDistPath)) {
  console.log('⚡ [Frontend] Melayani Modern React + Vite TSX App dari /frontend-react/dist');
  app.use(express.static(reactDistPath));
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/legacy')) {
      return next();
    }
    res.sendFile(path.join(reactDistPath, 'index.html'));
  });
} else {
  app.use(express.static(legacyFrontendPath));
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(legacyFrontendPath, 'index.html'));
  });
}

// Start Server & Database
const PORT = config.port;
app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(`🚀 Pasarin Backend Server berjalan di port ${PORT}`);
  console.log(`🌐 Website Frontend: http://localhost:${PORT}`);
  console.log(`🔐 Halaman Login:    http://localhost:${PORT}/login.html`);
  console.log(`📡 API Base URL:     http://localhost:${PORT}/api`);
  console.log('====================================================');
  await dbManager.init();
});
