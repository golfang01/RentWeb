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
      const { email, password, full_name } = req.body;

      // Validation
      if (!email || !password || !full_name) {
        return sendError(res, 'กรุณากรอก email, password และชื่อ-นามสกุล', 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex. test(email)) {
        return sendError(res, 'รูปแบบ email ไม่ถูกต้อง', 400);
      }

      if (password.length < 6) {
        return sendError(res, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 400);
      }

      // Check if email exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
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
        role:  'user',
      });

      // Generate token
      const token = jwt.sign(
        {
          user_id: user. user_id,
          email:  user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

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
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 'กรุณากรอก email และ password', 400);
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return sendError(res, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return sendError(res, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
      }

      // Generate token
      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user. email,
          role: user. role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password
      delete user.password_hash;

      sendSuccess(res, { user, token }, 'เข้าสู่ระบบสำเร็จ');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return sendError(res, 'ไม่พบข้อมูลผู้ใช้', 404);
      }

      sendSuccess(res, user, 'ดึงข้อมูลผู้ใช้สำเร็จ');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    sendSuccess(res, null, 'ออกจากระบบสำเร็จ');
  }
}

module.exports = new AuthController();