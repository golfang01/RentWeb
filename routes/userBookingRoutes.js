const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const bookingController = require('../controllers/bookingController');

// ✅ /my ต้องอยู่ก่อน /:id เสมอ!
router.get('/my',          authenticateToken, bookingController.getUserBookings);

// ✅ /:id อยู่หลัง
router.get('/:id',         authenticateToken, bookingController.getBookingById);
router.post('/',           authenticateToken, bookingController.createBooking);
router.post('/:id/cancel', authenticateToken, bookingController.cancelBooking);

module.exports = router;