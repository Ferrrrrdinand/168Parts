const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Admin Endpoints - Khusus Akun Admin Tunggal
router.get('/all', requireAdmin, orderController.getAllOrders);
router.put('/:id/status', requireAdmin, orderController.updateOrderStatus);
router.get('/returns/all', requireAdmin, orderController.getAllReturns);
router.put('/returns/:returnId/review', requireAdmin, orderController.reviewReturn);

// Customer Authenticated Endpoints
router.post('/checkout', requireAuth, orderController.checkout);
router.get('/', requireAuth, orderController.getMyOrders);
router.post('/:id/return', requireAuth, orderController.submitOrderReturn);
router.get('/:id/return', requireAuth, orderController.getOrderReturn);

module.exports = router;

