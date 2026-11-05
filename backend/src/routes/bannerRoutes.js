const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

router.get('/', bannerController.getBanners);
router.put('/', bannerController.updateBanners);
router.post('/reset', bannerController.resetBanners);

module.exports = router;

