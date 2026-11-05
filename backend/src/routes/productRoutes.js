const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// READ
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/flash-sale', productController.getFlashSale);
router.get('/:id', productController.getProductById);

// CREATE (CRUD - C)
router.post('/', productController.createProduct);

// UPDATE (CRUD - U)
router.put('/:id', productController.updateProduct);

// DELETE (CRUD - D)
router.delete('/:id', productController.deleteProduct);

module.exports = router;
