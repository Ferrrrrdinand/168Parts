const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/', bannerController.getBanners);
router.put('/', requireAdmin, bannerController.updateBanners);
router.post('/reset', requireAdmin, bannerController.resetBanners);

module.exports = router;

