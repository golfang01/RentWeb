const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const upload = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireShop } = require('../middlewares/shopMiddleware');

// GET /api/payments/:booking_id
router.get('/:booking_id', authenticateToken, paymentController.getPaymentByBooking);

// POST /api/payments/:booking_id/slip  ✅ ใช้ upload.single('slip') ที่นี่!
router.post(
  '/:booking_id/slip',
  authenticateToken,
  upload.single('slip'),
  paymentController.uploadSlip.bind(paymentController)
);

// POST /api/payments/:booking_id/verify
router.post('/:booking_id/verify', authenticateToken, requireShop, paymentController.verifyPayment);

// POST /api/payments/:booking_id/reject
router.post('/:booking_id/reject', authenticateToken, requireShop, paymentController.rejectPayment);

module.exports = router;