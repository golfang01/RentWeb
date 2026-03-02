const { pool } = require('../config/database');

class CategoryController {
  async getAllCategories(req, res) {
    try {
      const result = await pool.query(`
        SELECT category_id, name as category_name, icon_url, slug
        FROM categories
        ORDER BY name ASC
      `);
      res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(`
        SELECT category_id, name as category_name, icon_url, slug
        FROM categories WHERE category_id = $1
      `, [id]);

      if (result.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่' });

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  async getProductsByCategory(req, res) {
    try {
      const { id } = req.params;

      const categoryCheck = await pool.query(
        'SELECT category_id, name FROM categories WHERE category_id = $1', [id]
      );
      if (categoryCheck.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่' });

      // ✅ ใช้ชื่อ column ตาม DB จริง
      const result = await pool.query(`
        SELECT
          p.product_id,
          p.title          AS product_name,
          p.description,
          p.price_per_day  AS daily_rate,
          p.deposit_amount,
          p.buffer_days,
          p.status         AS availability_status,
          p.created_at,
          s.shop_id,
          s.shop_name,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url, 'display_order', pi.display_order)
              ORDER BY pi.display_order
            ) FILTER (WHERE pi.image_id IS NOT NULL),
            '[]'
          ) AS images
        FROM products p
        LEFT JOIN shops s ON p.shop_id = s.shop_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        WHERE p.category_id = $1
          AND p.status = 'active'
        GROUP BY p.product_id, s.shop_id, s.shop_name
        ORDER BY p.created_at DESC
      `, [id]);

      res.json({
        success: true,
        message: 'ดึงข้อมูลสินค้าสำเร็จ',
        category: { category_id: categoryCheck.rows[0].category_id, name: categoryCheck.rows[0].name },
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ getProductsByCategory Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new CategoryController();