const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController.js');
console.log("==== DEBUG BOOKING CONTROLLER ====");
console.log(bookingController);
console.log("typeof getUserBookings:", typeof bookingController.getUserBookings);
console.log("typeof createBooking:", typeof bookingController.createBooking);
console.log("typeof cancelBooking:", typeof bookingController.cancelBooking);
console.log("typeof getBookingById:", typeof bookingController.getBookingById);
const { authenticateToken } = require('../middlewares/authMiddleware.js');

// สร้างคำขอเช่า
router.post('/', authenticateToken, bookingController.createBooking);

// ดูประวัติการเช่าของตัวเอง
router.get('/my', authenticateToken, bookingController.getUserBookings);

// ยกเลิกการจอง
router.post('/:id/cancel', authenticateToken, bookingController.cancelBooking);

// ดูรายละเอียดการจอง
router.get('/:id', authenticateToken, bookingController.getBookingById);

module.exports = router;