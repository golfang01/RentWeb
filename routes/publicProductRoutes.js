const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/products - ดูสินค้าทั้งหมด (Public, รองรับ filter)
router.get('/', async (req, res) => {
  try {
    const { category_id, search, min_price, max_price, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [`p.availability_status = 'available'`];
    let values = [];
    let paramIndex = 1;

    if (category_id) {
      conditions.push(`p.category_id = $${paramIndex}`);
      values.push(category_id);
      paramIndex++;
    }
    if (search) {
      conditions.push(`p.product_name ILIKE $${paramIndex}`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (min_price) {
      conditions.push(`p.daily_rate >= $${paramIndex}`);
      values.push(min_price);
      paramIndex++;
    }
    if (max_price) {
      conditions.push(`p.daily_rate <= $${paramIndex}`);
      values.push(max_price);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);

    const result = await pool.query(
      `SELECT 
        p.product_id, p.product_name, p.description, p.daily_rate, p.deposit_amount,
        p.availability_status, p.created_at,
        c.category_name,
        s.shop_name, s.shop_id,
        COALESCE(
          (SELECT image_url FROM Product_Images WHERE product_id = p.product_id ORDER BY display_order LIMIT 1),
          NULL
        ) as thumbnail,
        COALESCE(AVG(r.rating)::NUMERIC(3,2), 0) as avg_rating,
        COUNT(DISTINCT r.review_id) as review_count
       FROM Products p
       LEFT JOIN Categories c ON p.category_id = c.category_id
       LEFT JOIN Shops s ON p.shop_id = s.shop_id
       LEFT JOIN Reviews r ON p.product_id = r.product_id
       ${whereClause}
       GROUP BY p.product_id, c.category_name, s.shop_name, s.shop_id
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('❌ [getPublicProducts] Error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// GET /api/products/:id - ดูรายละเอียดสินค้า (Public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        c.category_name,
        s.shop_name, s.shop_id, s.description as shop_description,
        COALESCE(
          json_agg(
            json_build_object('image_url', pi.image_url, 'display_order', pi.display_order)
            ORDER BY pi.display_order
          ) FILTER (WHERE pi.image_id IS NOT NULL),
          '[]'
        ) as images,
        COALESCE(AVG(r.rating)::NUMERIC(3,2), 0) as avg_rating,
        COUNT(DISTINCT r.review_id) as review_count
       FROM Products p
       LEFT JOIN Categories c ON p.category_id = c.category_id
       LEFT JOIN Shops s ON p.shop_id = s.shop_id
       LEFT JOIN Product_Images pi ON p.product_id = pi.product_id
       LEFT JOIN Reviews r ON p.product_id = r.product_id
       WHERE p.product_id = $1
       GROUP BY p.product_id, c.category_name, s.shop_name, s.shop_id, s.description`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ [getPublicProductById] Error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

module.exports = router;