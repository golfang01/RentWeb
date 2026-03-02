const { pool } = require('../config/database');

class PublicProductController {
  async getAllProducts(req, res) {
    try {
      const { search = '', category_id, min_price, max_price, page = 1, limit = 12 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const params = [];
      let paramIndex = 1;
      const conditions = ["p.status = 'active'"]; 

      if (search) { conditions.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`); params.push(`%${search}%`); paramIndex++; }
      if (category_id) { conditions.push(`p.category_id = $${paramIndex}`); params.push(parseInt(category_id)); paramIndex++; }
      if (min_price) { conditions.push(`p.price_per_day >= $${paramIndex}`); params.push(parseFloat(min_price)); paramIndex++; }
      if (max_price) { conditions.push(`p.price_per_day <= $${paramIndex}`); params.push(parseFloat(max_price)); paramIndex++; }

      const whereClause = 'WHERE ' + conditions.join(' AND ');
      const countResult = await pool.query('SELECT COUNT(DISTINCT p.product_id) as total FROM Products p ' + whereClause, params);
      const total = parseInt(countResult.rows[0].total);

      const result = await pool.query(`
        SELECT
          p.product_id,
          p.title AS product_name,
          p.description,
          p.price_per_day AS daily_rate,
          p.deposit_amount,
          p.status AS availability_status,
          p.created_at,
          c.category_id,
          c.name AS category_name,
          s.shop_id,
          s.shop_name,
          COALESCE((SELECT json_agg(json_build_object('image_url', pi.image_url, 'display_order', pi.display_order) ORDER BY pi.display_order) FROM Product_Images pi WHERE pi.product_id = p.product_id), '[]') AS images,
          COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
          COUNT(DISTINCT r.review_id) AS review_count
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.category_id
        LEFT JOIN Shops s ON p.shop_id = s.shop_id
        LEFT JOIN Reviews r ON p.product_id = r.product_id
        ${whereClause}
        GROUP BY p.product_id, c.category_id, c.name, s.shop_id, s.shop_name
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, parseInt(limit), offset]);

      res.json({
        success: true,
        message: 'ดึงข้อมูลสินค้าสำเร็จ',
        data: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('❌ [getAllProducts] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  async getProductDetail(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(`
        SELECT
          p.product_id,
          p.title AS product_name,
          p.description,
          p.price_per_day AS daily_rate,
          p.deposit_amount,
          p.status AS availability_status,
          p.created_at,
          c.category_id,
          c.name AS category_name,
          s.shop_id,
          s.shop_name,
          s.description AS shop_description,
          COALESCE((SELECT json_agg(json_build_object('image_url', pi.image_url, 'display_order', pi.display_order) ORDER BY pi.display_order) FROM Product_Images pi WHERE pi.product_id = p.product_id), '[]') AS images,
          COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
          COUNT(DISTINCT r.review_id) AS review_count
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.category_id
        LEFT JOIN Shops s ON p.shop_id = s.shop_id
        LEFT JOIN Reviews r ON p.product_id = r.product_id
        WHERE p.product_id = $1
        GROUP BY p.product_id, c.category_id, c.name, s.shop_id, s.shop_name, s.description
      `, [id]);

      if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
      res.json({ success: true, message: 'ดึงข้อมูลสินค้าสำเร็จ', data: result.rows[0] });
    } catch (error) {
      console.error('❌ [getProductDetail] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new PublicProductController();
