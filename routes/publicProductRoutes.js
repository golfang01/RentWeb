const express = require('express');
const router = express.Router();
const publicProductController = require('../controllers/publicProductController');

// Public routes - ไม่ต้อง Login
router.get('/', publicProductController.getAllProducts);
router.get('/:id', publicProductController.getProductDetail);

module.exports = router;
const conditions = ["p.status = 'active'"];  // ✅ ถูก