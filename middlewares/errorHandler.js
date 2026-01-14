const { sendError } = require('../utils/responseHelper');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // PostgreSQL errors
  if (err.code === '23505') {
    return sendError(res, 'ข้อมูลนี้มีอยู่แล้ว', 400);
  }

  if (err.code === '23503') {
    return sendError(res, 'ไม่พบข้อมูลที่อ้างอิง', 400);
  }

  if (err.code === '22P02') {
    return sendError(res, 'รูปแบบข้อมูลไม่ถูกต้อง', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Token ไม่ถูกต้อง', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token หมดอายุ', 401);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'เกิดข้อผิดพลาดภายในระบบ';

  sendError(res, message, statusCode);
};

module.exports = { errorHandler };