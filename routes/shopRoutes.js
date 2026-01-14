const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');

// สร้าง shop (ต้อง login)
router.post('/', authenticateToken, shopController.createShop);

// ดู shop ของตัวเอง (ต้อง login)
router.get('/me', authenticateToken, shopController.getMyShop);

// แก้ไขข้อมูล ร้าน(ต้อง login)
router.put('/me', authenticateToken, shopController.updateMyShop);

// ดู shop ทั้งหมด(ไม่ต้อง login)
router.get('/', shopController.getAllShops);

// ดู shop ตาม ID(ไม่ต้อง login)
router.get('/:id', shopController.getShopById);

module.exports = router;   