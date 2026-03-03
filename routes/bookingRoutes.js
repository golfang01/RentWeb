const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const requireShopAuth = require('../middlewares/requireShopAuth');

// Debug
console.log('✅ bookingRoutes loaded — /my อยู่ก่อน /:id');

// Static routes
router.get('/my', authenticateToken, bookingController.getUserBookings);
router.get('/shop/all', authenticateToken, requireShopAuth, bookingController.getShopBookings); // ใช้ requireShopAuth ได้เลย

router.post('/', authenticateToken, bookingController.createBooking);

// "Approve" booking สำหรับร้านค้า
router.post('/:id/approve', authenticateToken, requireShopAuth, bookingController.approveBooking.bind(bookingController));

router.get('/:id', authenticateToken, bookingController.getBookingById);
router.post('/:id/cancel', authenticateToken, bookingController.cancelBooking);
router.post('/:id/reject', authenticateToken, requireShopAuth, bookingController.rejectBooking.bind(bookingController));
router.post('/:id/picked-up', authenticateToken, requireShopAuth, bookingController.markAsPickedUp.bind(bookingController));
router.post('/:id/returned', authenticateToken, requireShopAuth, bookingController.markAsReturned.bind(bookingController));

module.exports = router;