const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// GET /api/reviews/my (ต้อง Login)
router.get('/my', authenticateToken, reviewController.getMyReviews);

// POST /api/reviews (ต้อง Login)
router.post('/', authenticateToken, reviewController.createReview);

// GET /api/reviews/product/:product_id (Public)
router.get('/product/:product_id', reviewController.getProductReviews);

// GET /api/reviews/shop/:shop_id (Public)
router.get('/shop/:shop_id', reviewController.getShopReviews);

module.exports = router;