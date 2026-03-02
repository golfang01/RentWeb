const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      console.log('=====================================');
      console.log('🔐 [register] เริ่มลงทะเบียน');
      console.log('🔐 [register] req.body:', req.body);
      
      const { email, password, full_name, role } = req.body;

      // Validation
      if (!email || !password || !full_name) {
        console.log('❌ [register] ข้อมูลไม่ครบ');
        console.log('=====================================');
        return sendError(res, 'กรุณากรอก email, password และชื่อ-นามสกุล', 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('❌ [register] Email ไม่ถูกต้อง');
        console.log('=====================================');
        return sendError(res, 'รูปแบบ email ไม่ถูกต้อง', 400);
      }

      if (password.length < 6) {
        console.log('❌ [register] รหัสผ่านสั้นเกินไป');
        console.log('=====================================');
        return sendError(res, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 400);
      }

      // Check if email exists
      const existingUser = await User.findByEmail(email);
      console.log('🔐 [register] Email exists:', existingUser ? 'Yes' : 'No');
      
      if (existingUser) {
        console.log('❌ [register] Email ซ้ำ');
        console.log('=====================================');
        return sendError(res, 'อีเมลนี้ถูกใช้งานแล้ว', 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
  email,
  password_hash,
  full_name,
  role: role === 'shop_owner' ? 'shop_owner' : 'user', // ← hardcode! ไม่ได้รับค่าจาก req.body เลย
});

      console.log('✅ [register] สร้าง User สำเร็จ:', user.user_id);

      // Generate token
      const token = jwt.sign(
        {
          user_id: user. user_id,  // ✅ ถูกต้องแล้ว
          email:  user.email,
          role: user.role,
        },
        process.env. JWT_SECRET,
        { expiresIn: process.env. JWT_EXPIRES_IN || '7d' }
      );

      console.log('✅ [register] สร้าง Token สำเร็จ');
      console.log('🔐 [register] Token payload:', { user_id: user. user_id, email: user. email, role: user.role });
      console.log('=====================================');

      sendSuccess(
        res,
        {
          user: {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            kyc_status: user.kyc_status,
          },
          token,
        },
        'สมัครสมาชิกสำเร็จ',
        201
      );
    } catch (error) {
      console.error('❌ [register] Error:', error);
      console.log('=====================================');
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {  // ⭐ เพิ่ม "next" parameter
    try {
      console. log('=====================================');
      console.log('🔐 [login] เริ่ม Login');
      console.log('🔐 [login] req. body:', req.body);
      
      const { email, password } = req.body;

      if (!email || !password) {
        console.log('❌ [login] ข้อมูลไม่ครบ');
        console.log('=====================================');
        return sendError(res, 'กรุณากรอก email และ password', 400);
      }

      // Find user
      const user = await User.findByEmail(email);
      console.log('🔐 [login] User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('❌ [login] ไม่พบ User');
        console.log('=====================================');
        return sendError(res, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('🔐 [login] Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ [login] รหัสผ่านผิด');
        console.log('=====================================');
        return sendError(res, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
      }

      // Generate token
      const token = jwt.sign(
        {
          user_id:  user.user_id,  // ✅ ถูกต้องแล้ว
          email: user.email,
          role: user.role,
        },
        process. env.JWT_SECRET,
        { expiresIn: process. env.JWT_EXPIRES_IN || '7d' }
      );

      console.log('✅ [login] Login สำเร็จ');
      console.log('🔐 [login] Token payload:', { user_id: user.user_id, email: user.email, role: user.role });
      console.log('=====================================');

      // Remove password
      delete user.password_hash;

      sendSuccess(res, { user, token }, 'เข้าสู่ระบบสำเร็จ');
    } catch (error) {
      console.error('❌ [login] Error:', error);
      console.log('=====================================');
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      console.log('=====================================');
      console.log('🔐 [getMe] เริ่มดึงข้อมูล User');
      console.log('🔐 [getMe] req.user:', req.user);
      
      // ⭐ แก้ตรงนี้ - รองรับทั้ง "id" และ "user_id"
      const userId = req.user?. user_id || req.user?.id;
      console.log('🔐 [getMe] userId:', userId);
      
      const user = await User.findById(userId);

      if (!user) {
        console.log('❌ [getMe] ไม่พบ User');
        console.log('=====================================');
        return sendError(res, 'ไม่พบข้อมูลผู้ใช้', 404);
      }

      console.log('✅ [getMe] พบ User:', user. user_id);
      console.log('=====================================');

      sendSuccess(res, user, 'ดึงข้อมูลผู้ใช้สำเร็จ');
    } catch (error) {
      console.error('❌ [getMe] Error:', error);
      console.log('=====================================');
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    console.log('=====================================');
    console.log('🔐 [logout] Logout สำเร็จ');
    console.log('=====================================');
    sendSuccess(res, null, 'ออกจากระบบสำเร็จ');
  }
}

module. exports = new AuthController();