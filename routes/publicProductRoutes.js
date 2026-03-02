const express = require('express');
const router = express.Router();
const publicProductController = require('../controllers/publicProductController');

// GET /api/products
router.get('/', publicProductController.getAllProducts);

// GET /api/products/:id
router.get('/:id', publicProductController.getProductDetail);

module.exports = router;