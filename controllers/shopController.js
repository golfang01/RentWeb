const { pool } = require('../config/database');

class ShopController {
  // สร้างร้านค้า
  async createShop(req, res) {
    try {
      const user_id = req.user.user_id;
      const { shop_name, description } = req.body;  // ⭐ เปลี่ยนเป็น description

      if (! shop_name) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกชื่อร้านค้า',
        });
      }

      // Check if user already has a shop
      const existingShop = await pool.query(
        'SELECT shop_id FROM Shops WHERE user_id = $1',
        [user_id]
      );

      if (existingShop.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'คุณมีร้านค้าอยู่แล้ว',
        });
      }

      // Create shop
      const result = await pool. query(`
        INSERT INTO Shops (user_id, shop_name, description)
        VALUES ($1, $2, $3)
        RETURNING shop_id, shop_name, description, wallet_balance, created_at
      `, [user_id, shop_name, description || null]);  // ⭐ เปลี่ยนเป็น description

      res.status(201).json({
        success: true,
        message: 'สร้างร้านค้าสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ Create Shop Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error:  error.message,
      });
    }
  }

  // ดูร้านตัวเอง
  async getMyShop(req, res) {
    try {
      const user_id = req.user. user_id;

      const result = await pool.query(`
        SELECT 
          shop_id,
          user_id,
          shop_name,
          shop_logo,
          description,
          rating_score,
          wallet_balance,
          created_at
        FROM Shops
        WHERE user_id = $1
      `, [user_id]);

      if (result.rows.length === 0) {
        return res. status(404).json({
          success: false,
          message:  'ไม่พบร้านค้าของคุณ',
        });
      }

      res.json({
        success: true,
        message: 'ดึงข้อมูลร้านค้าสำเร็จ',
        data:  result.rows[0],
      });
    } catch (error) {
      console.error('❌ Get My Shop Error:', error);
      res.status(500).json({
        success: false,
        message:  'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูร้านค้าทั้งหมด
  async getAllShops(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          s. shop_id,
          s. shop_name,
          s.shop_logo,
          s.description,
          s.rating_score,
          s.created_at,
          u.user_id,
          u.full_name,
          u.email
        FROM Shops s
        JOIN Users u ON s.user_id = u.user_id
        ORDER BY s.created_at DESC
      `);

      res.json({
        success: true,
        message: 'ดึงข้อมูลร้านค้าทั้งหมดสำเร็จ',
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ Get All Shops Error:', error);
      res.status(500).json({
        success: false,
        message:  'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูร้านค้าตาม ID
  async getShopById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT 
          s.shop_id,
          s.shop_name,
          s.shop_logo,
          s.description,
          s.rating_score,
          s.wallet_balance,
          s.created_at,
          u.user_id,
          u.full_name,
          u.email,
          u.profile_image
        FROM Shops s
        JOIN Users u ON s.user_id = u.user_id
        WHERE s.shop_id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบร้านค้า',
        });
      }

      res.json({
        success: true,
        message:  'ดึงข้อมูลร้านค้าสำเร็จ',
        data: result. rows[0],
      });
    } catch (error) {
      console.error('❌ Get Shop By ID Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new ShopController();