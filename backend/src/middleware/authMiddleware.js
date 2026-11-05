const storage = require('../models/storage');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Silakan login terlebih dahulu.'
    });
  }

  const token = authHeader.split(' ')[1];
  const user = storage.verifyToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Sesi telah kedaluwarsa atau token tidak valid. Silakan login kembali.'
    });
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  // Izinkan setiap user yang login untuk mengedit produk, voucher, dan banner seperti admin (tanpa batasan identitas)
  requireAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Silakan login terlebih dahulu untuk mengakses fitur pengeditan ini.'
      });
    }
    req.user.canEdit = true;
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = storage.verifyToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth
};

