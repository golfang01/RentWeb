const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');

// สร้าง shop (ต้อง login)
router.post('/', authenticateToken, shopController.createShop);

// ดู shop ของตัวเอง (ต้อง login)
router.get('/me', authenticateToken, shopController.getMyShop);

// ดู shop ทั้งหมด
router.get('/', shopController.getAllShops);

// ดู shop ตาม ID
router.get('/:id', shopController.getShopById);

module.exports = router;   