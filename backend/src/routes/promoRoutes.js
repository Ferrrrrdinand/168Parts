const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { optionalAuth, requireAdmin } = require('../middleware/authMiddleware');

router.use(optionalAuth);

// Public / User Voucher Endpoints
router.get('/', promoController.getPromos);
router.get('/all', promoController.getAllPromos);
router.get('/my-vouchers', promoController.getMyVouchers);
router.post('/validate', promoController.validatePromo);
router.post('/:code/claim', promoController.claimPromo);

// Admin Endpoints
router.post('/', requireAdmin, promoController.createPromo);
router.put('/:code/status', requireAdmin, promoController.togglePromoStatus);
router.put('/:code', requireAdmin, promoController.updatePromo);
router.delete('/:code', requireAdmin, promoController.deletePromo);

module.exports = router;
