const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireShop } = require('../middlewares/shopMiddleware');

// ทุก Route ต้อง Login และมีร้านค้า
router.use(authenticateToken, requireShop);

//ดูคำขอเช่าทั้งหมดของร้าน
router.get('/', bookingController.getShopBookings);

//อนุมัติการจอง 
router.post('/:id/approve', bookingController.approveBooking);

//ปฏิเสธการจอง
router.post('/:id/reject', bookingController.rejectBooking);

//อัพเดตสถานะ "รับของเเล้ว"
router.post('/:id/pickd-up', bookingController.markAsPickedUp);

//อัพเดตสถานะ "คืนของเเล้ว"
router.post('/:id/returned', bookingController.markAsReturned);

module.exports = router;