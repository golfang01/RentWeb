const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Public route - ดูรีวิว (ไม่ต้อง Login)
router.get('/:id/reviews', reviewController.getProductReviews);

// Protected routes - ต้อง Login
router.post('/:id/reviews', authenticateToken, reviewController.createReview);
router.put('/reviews/:id', authenticateToken, reviewController.updateReview);
router.delete('/reviews/:id', authenticateToken, reviewController.deleteReview);

module.exports = router;