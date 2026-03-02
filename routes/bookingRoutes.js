const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireShop } = require('../middlewares/shopMiddleware');

// ✅ DEBUG — ดูว่า file นี้ถูก load ไหม
console.log('✅ bookingRoutes loaded — /my อยู่ก่อน /:id');

// ✅ Static routes ก่อน
router.get('/my',       authenticateToken,              bookingController.getUserBookings);
router.get('/shop/all', authenticateToken, requireShop, bookingController.getShopBookings);

router.post('/', authenticateToken, bookingController.createBooking);

// ✅ Dynamic /:id หลัง
router.get('/:id',            authenticateToken,              bookingController.getBookingById);
router.post('/:id/cancel',    authenticateToken,              bookingController.cancelBooking);
router.post('/:id/approve',   authenticateToken, requireShop, bookingController.approveBooking);
router.post('/:id/reject',    authenticateToken, requireShop, bookingController.rejectBooking);
router.post('/:id/picked-up', authenticateToken, requireShop, bookingController.markAsPickedUp);
router.post('/:id/returned',  authenticateToken, requireShop, bookingController.markAsReturned);

module.exports = router;