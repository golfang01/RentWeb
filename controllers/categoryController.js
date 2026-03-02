const { pool } = require('../config/database');

class CategoryController {
  async getAllCategories(req, res) {
    try {
      const result = await pool.query(`
        SELECT category_id, name AS category_name, icon_url, slug
        FROM categories
        ORDER BY name ASC
      `);
      res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      console.error('❌ getAllCategories Error:', error.message);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'SELECT category_id, name AS category_name, icon_url, slug FROM categories WHERE category_id = $1',
        [id]
      );
      if (result.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่' });
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('❌ getCategoryById Error:', error.message);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  async getProductsByCategory(req, res) {
    try {
      const { id } = req.params;
      console.log('📂 getProductsByCategory category_id:', id);

      const categoryCheck = await pool.query(
        'SELECT category_id, name FROM categories WHERE category_id = $1', [id]
      );
      if (categoryCheck.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่' });

      // ✅ ดึง column จริงจาก DB ก่อน แล้วค่อย alias
      const result = await pool.query(`
        SELECT
          p.product_id,
          COALESCE(p.title, p.product_name, '')    AS product_name,
          p.description,
          COALESCE(p.price_per_day, p.daily_rate)  AS daily_rate,
          p.deposit_amount,
          COALESCE(p.status, p.availability_status, 'active') AS availability_status,
          p.created_at,
          s.shop_id,
          s.shop_name,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object('image_url', pi.image_url, 'display_order', pi.display_order)
                ORDER BY pi.display_order
              )
              FROM product_images pi
              WHERE pi.product_id = p.product_id
            ),
            '[]'::json
          ) AS images
        FROM products p
        LEFT JOIN shops s ON p.shop_id = s.shop_id
        WHERE p.category_id = $1
        ORDER BY p.created_at DESC
      `, [id]);

      console.log('📂 พบสินค้า:', result.rows.length);
      res.json({
        success: true,
        message: 'ดึงข้อมูลสินค้าสำเร็จ',
        category: { category_id: categoryCheck.rows[0].category_id, name: categoryCheck.rows[0].name },
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ getProductsByCategory Error:', error.message);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new CategoryController();