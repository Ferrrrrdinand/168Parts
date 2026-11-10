const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, authController.updateProfile);
router.post('/change-password', requireAuth, authController.changePassword);
router.post('/logout', authController.logout);

// Rute Admin untuk Manajemen Data Akun Pelanggan
router.get('/customers', requireAdmin, authController.getAllCustomers);
router.get('/customers/:id', requireAdmin, authController.getCustomerDetail);
router.get('/users', requireAdmin, authController.getAllCustomers);

module.exports = router;

