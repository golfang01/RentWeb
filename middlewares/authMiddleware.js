const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  console.log('=====================================');
  console.log('🔐 [authenticateToken] เริ่มตรวจสอบ Token');
  
  const authHeader = req.headers['authorization'];
  console.log('🔐 [authenticateToken] Authorization Header:', authHeader ?  'มี' : 'ไม่มี');
  
  const token = authHeader && authHeader. split(' ')[1]; // Bearer TOKEN
  console.log('🔐 [authenticateToken] Token:', token ?  '✅ มี Token' : '❌ ไม่มี Token');

  if (!token) {
    console.log('❌ [authenticateToken] ไม่มี Token');
    console.log('=====================================');
    return res.status(401).json({
      success: false,
      message: 'กรุณา Login ก่อน',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ [authenticateToken] Token ไม่ถูกต้อง:', err.message);
      console.log('=====================================');
      return res.status(403).json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือหมดอายุ',
      });
    }

    console.log('✅ [authenticateToken] Token ถูกต้อง');
    console.log('🔐 [authenticateToken] Decoded payload:', user);  // ⭐ ดูว่า decode ได้อะไร
    
    // ⭐ ส่งต่อทั้งหมดโดยไม่แก้ไข
    req.user = user;
    
    console.log('✅ [authenticateToken] req.user ถูกตั้งค่าเรียบร้อย:', req.user);
    console.log('=====================================');
    next();
  });
};

module.exports = { authenticateToken };