const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
// 1. เรียกใช้ไฟล์เชื่อมต่อ Database (เช็ค path ให้ถูกนะครับว่า db อยู่ไหน)
const { pool } = require('../config/database');

// 2. เปลี่ยนเป็น async เพื่อรอ Database ตอบกลับ
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                user_id,
                email,
                password_hash,
                full_name,
                profile_image,
                role,
                kyc_status,
                created_at
            FROM users
        `);
        res.json({
            success: true,
            message: 'ดึงข้อมูล users สำเร็จ',
            data: result.rows,
            total: result.rows.length,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูล users',
            error: error.message,
        });
    }
});

// GET /api/users/:id - ดึงข้อมูล user ตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.email,
        u.full_name,
        u.profile_image,
        u.role,
        u.kyc_status,
        u.created_at,
        s.shop_id,
        s.shop_name,
        s.wallet_balance
      FROM Users u
      LEFT JOIN Shops s ON u.user_id = s.user_id
      WHERE u.user_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบ user ID: ${id}`,
      });
    }

    res.json({
      success: true,
      message: 'ดึงข้อมูล user สำเร็จ',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(' Error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาด:  ' + error.message,
    });
  }
});

// POST /api/users - สร้าง user ใหม่ในฐานข้อมูล
router.post('/', async (req, res) => {
  try {
    const { email, full_name, password, role = 'user' } = req.body;

    // Validation
    if (!email || !full_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก email, full_name และ password',
      });
    }

    // Check if email already exists
    const checkEmail = await pool.query(
      'SELECT user_id FROM Users WHERE email = $1',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว',
      });
    }

    //3. hash password ด้วย bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(`
      INSERT INTO Users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, email, full_name, role, kyc_status, created_at
    `, [email, hashedPassword, full_name, role]);
    
    res.status(201).json({
      success: true,
      message: 'สร้าง user สำเร็จ',
      data: result.rows[0],
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้าง user',
        error: error.message,
    });
  }
});

// Delete /api/users/:id - ลบ user ตาม ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Users WHERE user_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) { 
        return res.status(404).json({
            success: false,
            message: `ไม่พบ user ID: ${id}`,
        });
    }
    res.json({
        success: true,
        message: 'ลบ user สำเร็จ',
        data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบ user',
        error: error.message,
    });
  }
});

//put /api/users/:id - แก้ไขข้อมูล user ตาม ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, profile_image, role, kyc_status } = req.body;
    const result = await pool.query(`
      UPDATE Users
      SET full_name = $1, profile_image = $2, role = $3, kyc_status = $4
      WHERE user_id = $5
      RETURNING user_id, email, full_name, profile_image, role, kyc_status, created_at
    `, [full_name, profile_image, role, kyc_status, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบ user ID: ${id}`,
      });
    }
    res.json({
      success: true,
      message: 'แก้ไขข้อมูล user สำเร็จ',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
        success: false,
        message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล user',
        error: error.message,
    });
  }
});

//path: 
    router.patch('/:id/password', async (req, res) => {
      try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) {
          return res.status(400).json({
            success: false,
            message: 'กรุณากรอก NewPassword',
          });
        }   

      } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการแก้ไขรหัสผ่าน',
          error: error.message,
        });
      }
    });

module.exports = router;