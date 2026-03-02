const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// GET /api/reviews/my
router.get('/my', authenticateToken, reviewController.getMyReviews);

// POST /api/reviews
router.post('/', authenticateToken, reviewController.createReview);

// GET /api/reviews/product/:product_id
router.get('/product/:product_id', reviewController.getProductReviews);

// GET /api/reviews/shop/:shop_id
router.get('/shop/:shop_id', reviewController.getShopReviews);

module.exports = router;