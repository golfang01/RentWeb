const express = require('express');
const router = express. Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router. get('/me', authenticateToken, authController.getMe);
router.post('/logout', authenticateToken, authController.logout);

// ⭐ สำคัญมาก: ต้องมีบรรทัดนี้
module. exports = router;