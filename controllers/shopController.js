const { pool } = require('../config/database');

class ShopController {
  // สร้างร้านค้า
  async createShop(req, res) {
    try {
      console.log('=====================================');
      console.log('🏪 [createShop] เริ่มสร้างร้าน');
      console.log('🏪 [createShop] req.user:', req.user);
      
      const user_id = req.user?. user_id;
      console.log('🏪 [createShop] user_id:', user_id);
      
      // ⭐ เช็คว่า Login แล้วหรือยัง
      if (!user_id) {
        console.log('❌ [createShop] ไม่พบ user_id - ต้อง Login ก่อน');
        console.log('=====================================');
        return res.status(401).json({
          success: false,
          message: 'กรุณา Login ก่อน',
        });
      }
      
      const { shop_name, description, shop_logo } = req.body;
      console.log('🏪 [createShop] req.body:', req.body);

      // Validation
      if (!shop_name) {
        console.log('❌ [createShop] ไม่มีชื่อร้าน');
        console.log('=====================================');
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกชื่อร้าน',
        });
      }

      // ⭐ เช็คว่า User มีร้านแล้วหรือยัง (1 User = 1 ร้าน)
      const checkShop = await pool.query(
        'SELECT shop_id, shop_name FROM Shops WHERE user_id = $1',
        [user_id]
      );

      console.log('🏪 [createShop] Check existing shop:', checkShop.rows);

      if (checkShop. rows.length > 0) {
        console.log('❌ [createShop] User มีร้านอยู่แล้ว:', checkShop.rows[0]);
        console.log('=====================================');
        return res.status(400).json({
          success: false,
          message: 'คุณมีร้านค้าอยู่แล้ว:  ' + checkShop.rows[0].shop_name,
          existing_shop: checkShop.rows[0],
        });
      }

      // สร้างร้านใหม่
      const result = await pool.query(`
        INSERT INTO Shops (user_id, shop_name, description, shop_logo, wallet_balance)
        VALUES ($1, $2, $3, $4, 0.00)
        RETURNING *
      `, [user_id, shop_name, description || null, shop_logo || null]);

      console.log('✅ [createShop] สร้างร้านสำเร็จ:', result.rows[0]);
      console.log('=====================================');

      res.status(201).json({
        success: true,
        message: 'สร้างร้านค้าสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [createShop] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error. message,
      });
    }
  }

  // ดูร้านตัวเอง
  async getMyShop(req, res) {
    try {
      console.log('=====================================');
      console.log('🏪 [getMyShop] เริ่มดึงข้อมูลร้านตัวเอง');
      console.log('🏪 [getMyShop] req.user:', req.user);
      
      const user_id = req.user?.user_id;
      console.log('🏪 [getMyShop] user_id:', user_id);

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

      console.log('🏪 [getMyShop] ผลลัพธ์:', result.rows);

      if (result.rows.length === 0) {
        console.log('❌ [getMyShop] ไม่พบร้าน');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบร้านค้าของคุณ',
        });
      }

      console.log('✅ [getMyShop] พบร้าน');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลร้านค้าสำเร็จ',
        data: result. rows[0],
      });
    } catch (error) {
      console.error('❌ [getMyShop] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // แก้ไขข้อมูลร้าน
  async updateMyShop(req, res) {
    try {
      console. log('=====================================');
      console.log('🏪 [updateMyShop] เริ่มแก้ไขร้าน');
      console.log('🏪 [updateMyShop] req.user:', req.user);
      console.log('🏪 [updateMyShop] req.body:', req.body);
      
      const user_id = req. user?.user_id;
      const { shop_name, description, shop_logo } = req.body;

      // Check if user has shop
      const checkShop = await pool.query(
        'SELECT shop_id FROM Shops WHERE user_id = $1',
        [user_id]
      );

      console.log('🏪 [updateMyShop] Check shop:', checkShop.rows);

      if (checkShop.rows.length === 0) {
        console.log('❌ [updateMyShop] ไม่พบร้าน');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบร้านค้าของคุณ',
        });
      }

      // Build dynamic update
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (shop_name !== undefined) {
        fields.push(`shop_name = $${paramIndex}`);
        values.push(shop_name);
        paramIndex++;
      }
      if (description !== undefined) {
        fields.push(`description = $${paramIndex}`);
        values.push(description);
        paramIndex++;
      }
      if (shop_logo !== undefined) {
        fields.push(`shop_logo = $${paramIndex}`);
        values.push(shop_logo);
        paramIndex++;
      }

      if (fields. length === 0) {
        console.log('❌ [updateMyShop] ไม่มีข้อมูลที่จะแก้ไข');
        console.log('=====================================');
        return res.status(400).json({
          success: false,
          message: 'ไม่มีข้อมูลที่จะแก้ไข',
        });
      }

      values. push(user_id);
      const query = `
        UPDATE Shops
        SET ${fields.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      console.log('🏪 [updateMyShop] Query:', query);
      console.log('🏪 [updateMyShop] Values:', values);

      const result = await pool.query(query, values);

      console.log('✅ [updateMyShop] แก้ไขสำเร็จ:', result.rows[0]);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'แก้ไขข้อมูลร้านสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [updateMyShop] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูร้านค้าทั้งหมด (Public - ไม่ต้อง Login)
  async getAllShops(req, res) {
    try {
      console.log('=====================================');
      console.log('🏪 [getAllShops] เริ่มดึงข้อมูลร้านทั้งหมด');
      
      const result = await pool.query(`
        SELECT 
          s.*,
          u.full_name,
          u.email
        FROM Shops s
        LEFT JOIN Users u ON s.user_id = u.user_id
        ORDER BY s.shop_id ASC
      `);
      
      console.log('🏪 [getAllShops] ผลลัพธ์:', result.rows);
      console.log('🏪 [getAllShops] จำนวนร้าน:', result.rows. length);
      console.log('=====================================');
      
      res.json({
        success: true,
        message: 'ดึงข้อมูลร้านค้าทั้งหมดสำเร็จ',
        data: result.rows,
        total: result.rows. length,
      });
    } catch (error) {
      console.error('❌ [getAllShops] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูร้านค้าตาม ID (Public - ไม่ต้อง Login)
  async getShopById(req, res) {
    try {
      console.log('=====================================');
      console.log('🏪 [getShopById] เริ่มดึงร้านตาม ID');
      
      const { id } = req.params;
      console.log('🏪 [getShopById] shop_id:', id);

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
        LEFT JOIN Users u ON s.user_id = u.user_id
        WHERE s.shop_id = $1
      `, [id]);

      console.log('🏪 [getShopById] ผลลัพธ์:', result.rows);

      if (result.rows.length === 0) {
        console.log('❌ [getShopById] ไม่พบร้าน');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบร้านค้า',
        });
      }

      console.log('✅ [getShopById] พบร้าน');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลร้านค้าสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [getShopById] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message:  'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new ShopController();