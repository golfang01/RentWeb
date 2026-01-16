const { pool } = require('../config/database');

class CategoryController {
  // ดูหมวดหมู่ทั้งหมด (Public)
  async getAllCategories(req, res) {
    try {
      console.log('=====================================');
      console.log('📂 [getAllCategories] เริ่มดึงข้อมูลหมวดหมู่');

      const result = await pool.query(`
        SELECT 
          category_id,
          name as category_name,
          icon_url,
          slug
        FROM Categories
        ORDER BY name ASC
      `);

      console.log('📂 [getAllCategories] พบหมวดหมู่:', result.rows. length);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลหมวดหมู่สำเร็จ',
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ [getAllCategories] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message:  'เกิดข้อผิดพลาด',
        error: error. message,
      });
    }
  }

  // ดูหมวดหมู่ตาม ID (Public)
  async getCategoryById(req, res) {
    try {
      console. log('=====================================');
      console.log('📂 [getCategoryById] เริ่มดึงหมวดหมู่');

      const { id } = req.params;
      console.log('📂 [getCategoryById] category_id:', id);

      const result = await pool.query(`
        SELECT 
          category_id,
          name as category_name,
          icon_url,
          slug
        FROM Categories
        WHERE category_id = $1
      `, [id]);

      console.log('📂 [getCategoryById] ผลลัพธ์:', result.rows);

      if (result.rows.length === 0) {
        console.log('❌ [getCategoryById] ไม่พบหมวดหมู่');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบหมวดหมู่',
        });
      }

      console.log('✅ [getCategoryById] พบหมวดหมู่');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลหมวดหมู่สำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [getCategoryById] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message:  'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูสินค้าในหมวดหมู่ (Public)
  async getProductsByCategory(req, res) {
    try {
      console.log('=====================================');
      console.log('📂 [getProductsByCategory] เริ่มดึงสินค้าในหมวดหมู่');

      const { id } = req.params;
      console.log('📂 [getProductsByCategory] category_id:', id);

      // เช็คว่ามีหมวดหมู่นี้หรือไม่
      const categoryCheck = await pool.query(
        'SELECT category_id, name FROM Categories WHERE category_id = $1',
        [id]
      );

      if (categoryCheck.rows.length === 0) {
        console.log('❌ [getProductsByCategory] ไม่พบหมวดหมู่');
        console.log('=====================================');
        return res. status(404).json({
          success: false,
          message:  'ไม่พบหมวดหมู่',
        });
      }

      // ดึงสินค้าในหมวดหมู่
      const result = await pool.query(`
        SELECT 
          p.product_id,
          p.product_name,
          p.description,
          p.daily_rate,
          p.deposit_amount,
          p.availability_status,
          p.rating_score,
          p.created_at,
          s.shop_id,
          s.shop_name,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url, 'display_order', pi.display_order)
              ORDER BY pi.display_order
            ) FILTER (WHERE pi.image_id IS NOT NULL),
            '[]'
          ) as images
        FROM Products p
        LEFT JOIN Shops s ON p.shop_id = s.shop_id
        LEFT JOIN Product_Images pi ON p.product_id = pi.product_id
        WHERE p.category_id = $1
        GROUP BY p. product_id, s.shop_id, s.shop_name
        ORDER BY p. created_at DESC
      `, [id]);

      console.log('📂 [getProductsByCategory] พบสินค้า:', result.rows.length);
      console.log('=====================================');

      res.json({
        success: true,
        message:  'ดึงข้อมูลสินค้าสำเร็จ',
        category: {
          category_id: categoryCheck.rows[0].category_id,
          name: categoryCheck.rows[0]. name,
        },
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ [getProductsByCategory] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new CategoryController();