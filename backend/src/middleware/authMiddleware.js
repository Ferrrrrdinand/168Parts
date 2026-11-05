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
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin' || (req.user.email && req.user.email.toLowerCase() !== 'admin@pasarin.com')) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Fitur ini hanya dapat diakses oleh Akun Administrator Tunggal Pasarin (admin@pasarin.com).'
      });
    }
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

