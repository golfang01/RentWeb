const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// สร้างคำขอเช่า
router.post('/', authenticateToken, bookingController.createBooking);

// ดูประวัติการเช่าของตัวเอง
router.get('/my', authenticateToken, bookingController.getUserBookings);

// ยกเลิกการจอง
router.post('/:id/cancel', authenticateToken, bookingController.cancelBooking);

// ดูรายละเอียดการจอง
router.get('/:id', authenticateToken, bookingController.getBookingById);

module.exports = router;