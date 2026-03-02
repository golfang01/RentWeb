const express = require('express');
const router = express.Router();
const productImageController = require('../controllers/productImageController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireShop } = require('../middlewares/shopMiddleware');

// Public route - ดูรูปภาพสินค้า (ไม่ต้อง Login)
router.get('/:id/images', productImageController.getProductImages);

// Protected routes - ต้อง Login และมีร้าน
router.post('/:id/images', authenticateToken, requireShop, productImageController.addProductImage);
router.put('/:id/images/:imageId/primary', authenticateToken, requireShop, productImageController.setPrimaryImage);
router.delete('/:id/images/:imageId', authenticateToken, requireShop, productImageController.deleteProductImage);

module.exports = router;