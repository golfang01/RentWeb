const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');
const { requireShop} = require('../middlewares/shopMiddleware');

// ต้อง Login และมีร้านค้าถ
router.use(authenticateToken, requireShop);

// ลงสินค้าใหม่
router.post('/', productController.createProduct);

// ดูสินค้าของร้านตัวเอง
router.get('/', productController.getMyProducts);

// ดูสินค้าตาม ID
router.get('/:id', productController.getProductById);

// แก้ไขสินค้า
router.put('/:id', productController.updateProduct);

// ลบสินค้า
router.delete('/:id', productController.deleteProduct);

module.exports = router;