const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireShop } = require('../middlewares/shopMiddleware');

// ============================================================
// 🙋 User (Renter) Routes ��� ต้อง Login เท่านั้น
// Base: /api/bookings
// ============================================================

// สร้างคำขอเช่า
router.post('/', authenticateToken, bookingController.createBooking);

// ดูประวัติการเช่าของตัวเอง
router.get('/my', authenticateToken, bookingController.getUserBookings);

// ยกเลิกการจอง (ได้เฉพาะตอน status = 'pending')
router.post('/:id/cancel', authenticateToken, bookingController.cancelBooking);

// ดูรายละเอียดการจองตาม ID (เฉพาะของตัวเอง)
router.get('/:id', authenticateToken, bookingController.getBookingById);

// ============================================================
// 🧑‍💼 Shop Owner Routes — ต้อง Login + มีร้านค้า
// Base: /api/shops/bookings
// ============================================================

// ดูการจองทั้งหมดของร้าน (กรองด้วย ?status=pending|confirmed|...)
router.get('/shop/all', authenticateToken, requireShop, bookingController.getShopBookings);

// อนุมัติการจอง  pending → confirmed
router.post('/:id/approve', authenticateToken, requireShop, bookingController.approveBooking);

// ปฏิเสธการจอง  pending → rejected
router.post('/:id/reject', authenticateToken, requireShop, bookingController.rejectBooking);

// อัพเดตสถานะ "รับของแล้ว"  confirmed → picked_up
router.post('/:id/picked-up', authenticateToken, requireShop, bookingController.markAsPickedUp);

// อัพเดตสถานะ "คืนของแล้ว"  picked_up → completed
router.post('/:id/returned', authenticateToken, requireShop, bookingController.markAsReturned);

module.exports = router;