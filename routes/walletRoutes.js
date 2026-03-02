const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireShop } = require('../middlewares/shopMiddleware');

// ทุก Route ต้อง Login + มีร้าน
router.use(authenticateToken, requireShop);

// GET /api/wallet — ดูยอด Wallet ของร้าน
router.get('/', walletController.getWalletBalance);

// GET /api/wallet/transactions — ดูประวัติธุรกรรม
router.get('/transactions', walletController.getTransactions);

// POST /api/wallet/withdraw — ขอถอนเงิน
router.post('/withdraw', walletController.requestWithdrawal);

// GET /api/wallet/withdrawals — ดูประวัติการถอนเงิน
router.get('/withdrawals', walletController.getWithdrawals);

module.exports = router;