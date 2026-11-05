const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');

router.get('/', promoController.getPromos);
router.get('/all', promoController.getAllPromos);
router.post('/validate', promoController.validatePromo);
router.post('/', promoController.createPromo);
router.put('/:code/status', promoController.togglePromoStatus);
router.put('/:code', promoController.updatePromo);
router.delete('/:code', promoController.deletePromo);

module.exports = router;

