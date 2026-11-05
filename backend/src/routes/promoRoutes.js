const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/', promoController.getPromos);
router.get('/all', promoController.getAllPromos);
router.post('/validate', promoController.validatePromo);

// Khusus Akun Admin Tunggal
router.post('/', requireAdmin, promoController.createPromo);
router.put('/:code/status', requireAdmin, promoController.togglePromoStatus);
router.put('/:code', requireAdmin, promoController.updatePromo);
router.delete('/:code', requireAdmin, promoController.deletePromo);

module.exports = router;

