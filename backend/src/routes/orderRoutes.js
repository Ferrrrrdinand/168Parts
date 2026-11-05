const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Admin Endpoints - Khusus Akun Admin Tunggal
router.get('/all', requireAdmin, orderController.getAllOrders);
router.put('/:id/status', requireAdmin, orderController.updateOrderStatus);

// Customer Authenticated Endpoints
router.post('/checkout', requireAuth, orderController.checkout);
router.get('/', requireAuth, orderController.getMyOrders);

module.exports = router;

