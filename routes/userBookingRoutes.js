const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const bookingController = require('../controllers/bookingController');

// User routes (ต้อง Login)
router.get('/', authenticateToken, bookingController.getUserBookings);
router.get('/:id', authenticateToken, bookingController.getBookingById);
router.post('/', authenticateToken, bookingController.createBooking);
router.put('/:id/cancel', authenticateToken, bookingController.cancelBooking);

module.exports = router;