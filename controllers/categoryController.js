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
      console.log('📂 getProductsByCategory id:', id);

      // เช็ค category
      const categoryCheck = await pool.query(
        'SELECT category_id, name FROM categories WHERE category_id = $1', [id]
      );
      if (categoryCheck.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่' });

      // ✅ Step 1: ดึง products + shops ก่อน (ไม่ join product_images)
      const productResult = await pool.query(`
        SELECT
          p.product_id,
          p.title            AS product_name,
          p.description,
          p.price_per_day    AS daily_rate,
          p.deposit_amount,
          p.status           AS availability_status,
          p.created_at,
          s.shop_id,
          s.shop_name
        FROM products p
        LEFT JOIN shops s ON p.shop_id = s.shop_id
        WHERE p.category_id = $1
        ORDER BY p.created_at DESC
      `, [id]);

      console.log('📂 พบสินค้า:', productResult.rows.length);

      // ✅ Step 2: ดึง images แยก (ป้องกัน column ผิด)
      const products = await Promise.all(
        productResult.rows.map(async (product) => {
          try {
            const imgResult = await pool.query(
              'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY display_order ASC LIMIT 5',
              [product.product_id]
            );
            return { ...product, images: imgResult.rows };
          } catch {
            return { ...product, images: [] };
          }
        })
      );

      res.json({
        success: true,
        message: 'ดึงข้อมูลสินค้าสำเร็จ',
        category: {
          category_id: categoryCheck.rows[0].category_id,
          name: categoryCheck.rows[0].name,
        },
        data: products,
        total: products.length,
      });
    } catch (error) {
      console.error('❌ getProductsByCategory Error:', error.message);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new CategoryController();