const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAdmin } = require('../middleware/authMiddleware');

// READ (Publik)
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/flash-sale', productController.getFlashSale);
router.get('/:id', productController.getProductById);

// CREATE (CRUD - C) - Khusus Akun Admin Tunggal
router.post('/', requireAdmin, productController.createProduct);

// UPDATE (CRUD - U) - Khusus Akun Admin Tunggal
router.put('/:id', requireAdmin, productController.updateProduct);

// DELETE (CRUD - D) - Khusus Akun Admin Tunggal
router.delete('/:id', requireAdmin, productController.deleteProduct);

module.exports = router;
