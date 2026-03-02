const { pool } = require('../config/database');

class ReviewController {
  // สร้างรีวิว (User หลังจากคืนของแล้ว)
  // POST /api/reviews
  async createReview(req, res) {
    try {
      const user_id = req.user?.user_id || req.user?.id;
      const { booking_id, rating, comment } = req.body;

      if (!booking_id || !rating) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุ booking_id และ rating (1-5)' });
      }
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'rating ต้องอยู่ระหว่าง 1 ถึง 5' });
      }

      const bookingCheck = await pool.query(
        'SELECT booking_id, status, renter_id, product_id, shop_id FROM Bookings WHERE booking_id = $1 AND renter_id = $2',
        [booking_id, user_id]
      );
      if (bookingCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });

      const booking = bookingCheck.rows[0];
      if (booking.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'สามารถรีวิวได้เฉพาะการเช่าที่เสร็จสิ้นแล้วเท่านั้น' });
      }

      const existingReview = await pool.query('SELECT review_id FROM Reviews WHERE booking_id = $1', [booking_id]);
      if (existingReview.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'คุณรีวิวการเช่านี้ไปแล้ว' });
      }

      const result = await pool.query(`
        INSERT INTO Reviews (booking_id, product_id, shop_id, reviewer_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [booking_id, booking.product_id, booking.shop_id, user_id, rating, comment || null]);

      res.status(201).json({ success: true, message: 'รีวิวสำเร็จ ขอบคุณสำหรับความคิดเห็น!', data: result.rows[0] });
    } catch (error) {
      console.error('❌ [createReview] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ดูรีวิวของสินค้า (Public)
  // GET /api/reviews/product/:product_id
  async getProductReviews(req, res) {
    try {
      const { product_id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const countResult = await pool.query('SELECT COUNT(*) as total FROM Reviews WHERE product_id = $1', [product_id]);
      const total = parseInt(countResult.rows[0].total);

      const result = await pool.query(`
        SELECT r.review_id, r.rating, r.comment, r.created_at,
               u.full_name AS reviewer_name, u.profile_image AS reviewer_image
        FROM Reviews r
        JOIN Users u ON r.reviewer_id = u.user_id
        WHERE r.product_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `, [product_id, parseInt(limit), offset]);

      const avgResult = await pool.query(`
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating, COUNT(*) AS total_reviews,
          COUNT(CASE WHEN rating = 5 THEN 1 END) AS five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END) AS four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END) AS three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END) AS two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END) AS one_star
        FROM Reviews WHERE product_id = $1
      `, [product_id]);

      res.json({
        success: true,
        message: 'ดึงข้อมูลรีวิวสำเร็จ',
        summary: avgResult.rows[0],
        data: result.rows,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (error) {
      console.error('❌ [getProductReviews] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ดูรีวิวของร้าน (Public)
  // GET /api/reviews/shop/:shop_id
  async getShopReviews(req, res) {
    try {
      const { shop_id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const countResult = await pool.query('SELECT COUNT(*) as total FROM Reviews WHERE shop_id = $1', [shop_id]);
      const total = parseInt(countResult.rows[0].total);

      const result = await pool.query(`
        SELECT r.review_id, r.rating, r.comment, r.created_at,
               u.full_name AS reviewer_name, u.profile_image AS reviewer_image, p.product_name
        FROM Reviews r
        JOIN Users u ON r.reviewer_id = u.user_id
        JOIN Products p ON r.product_id = p.product_id
        WHERE r.shop_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `, [shop_id, parseInt(limit), offset]);

      const avgResult = await pool.query(
        'SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating, COUNT(*) AS total_reviews FROM Reviews WHERE shop_id = $1',
        [shop_id]
      );

      res.json({
        success: true,
        message: 'ดึงข้อมูลรีวิวร้านสำเร็จ',
        summary: avgResult.rows[0],
        data: result.rows,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (error) {
      console.error('❌ [getShopReviews] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ดูรีวิวที่ฉันเขียน
  // GET /api/reviews/my
  async getMyReviews(req, res) {
    try {
      const user_id = req.user?.user_id || req.user?.id;
      const result = await pool.query(`
        SELECT r.*, p.product_name, s.shop_name
        FROM Reviews r
        JOIN Products p ON r.product_id = p.product_id
        JOIN Shops s ON r.shop_id = s.shop_id
        WHERE r.reviewer_id = $1
        ORDER BY r.created_at DESC
      `, [user_id]);

      res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      console.error('❌ [getMyReviews] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new ReviewController();