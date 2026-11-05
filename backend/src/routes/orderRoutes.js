const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth } = require('../middleware/authMiddleware');

// Admin / Dashboard Endpoints
router.get('/all', orderController.getAllOrders);
router.put('/:id/status', orderController.updateOrderStatus);

// Customer Authenticated Endpoints
router.post('/checkout', requireAuth, orderController.checkout);
router.get('/', requireAuth, orderController.getMyOrders);

module.exports = router;

