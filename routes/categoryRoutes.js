const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// ดูหมวดหมู่ทั้งหมด (public)
router.get('/', categoryController.getAllCategories);

// ดูหมวดหมู่ตาม ID
router.get('/:id', categoryController.getCategoryById);

// ดูสินค้าตามหมวดหมู่
router.get('/:id/products', categoryController.getProductsByCategory);

module.exports = router;