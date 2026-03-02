const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');

// ทุก Route ต้อง Login + เป็น Admin
router.use(authenticateToken, authorize('admin'));

// ============ Users ============
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// ============ Shops ============
router.get('/shops', adminController.getAllShops);
router.delete('/shops/:id', adminController.deleteShop);

// ============ Categories ============
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// ============ Withdrawals ============
router.get('/withdrawals', adminController.getAllWithdrawals);
router.post('/withdrawals/:id/approve', adminController.approveWithdrawal);
router.post('/withdrawals/:id/reject', adminController.rejectWithdrawal);

module.exports = router;