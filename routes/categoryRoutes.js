const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public routes (No login required)
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/products', categoryController.getProductsByCategory);

module.exports = router;