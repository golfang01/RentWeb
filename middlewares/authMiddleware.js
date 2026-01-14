const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseHelper');
require('dotenv').config({ path: './DB. env' });

/**
 * Middleware to verify JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return sendError(res, 'กรุณาเข้าสู่ระบบ', 401);
  }

  try {
    const decoded = jwt. verify(token, process.env. JWT_SECRET);
    
    req.user = {
      id: decoded.user_id,
      email: decoded. email,
      role: decoded. role,
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
    }
    return sendError(res, 'Token ไม่ถูกต้อง', 403);
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 'ต้องมีสิทธิ์ Admin เท่านั้น', 403);
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };