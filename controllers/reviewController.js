const { pool } = require('../config/database');

class ReviewController {
  // เขียนรีวิว (ต้องเช่าสินค้าแล้ว)
  async createReview(req, res) {
    try {
      console.log('=====================================');
      console.log('⭐ [createReview] เริ่มสร้างรีวิว');
      console.log('⭐ [createReview] req.body:', req.body);
      console.log('⭐ [createReview] req.params:', req.params);
      console.log('⭐ [createReview] req.user:', req.user);

      const { id: product_id } = req.params;
      const { rating, comment } = req.body;
      const user_id = req.user?.user_id || req.user?.id;

      // Validation
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาให้คะแนน 1-5 ดาว',
        });
      }

      // ตรวจสอบว่ามีสินค้านี้หรือไม่
      const productCheck = await pool.query(
        'SELECT product_id, title FROM Products WHERE product_id = $1',
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้า',
        });
      }

      // ตรวจสอบว่าเคยเช่าสินค้านี้หรือไม่ (และเสร็จสิ้นแล้ว)
      const bookingCheck = await pool.query(`
        SELECT booking_id 
        FROM Bookings 
        WHERE renter_id = $1 
          AND product_id = $2 
          AND status = 'completed'
        LIMIT 1
      `, [user_id, product_id]);

      if (bookingCheck.rows.length === 0) {
        console.log('❌ [createReview] ยังไม่เคยเช่าสินค้านี้');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'คุณต้องเช่าสินค้านี้และเสร็จสิ้นแล้วจึงจะรีวิวได้',
        });
      }

      const booking_id = bookingCheck.rows[0].booking_id;

      // ตรวจสอบว่าเคยรีวิว booking นี้แล้วหรือยัง
      const reviewCheck = await pool.query(
        'SELECT review_id FROM Reviews WHERE booking_id = $1',
        [booking_id]
      );

      if (reviewCheck.rows.length > 0) {
        console.log('❌ [createReview] เคยรีวิวแล้ว');
        console.log('=====================================');
        return res.status(400).json({
          success: false,
          message: 'คุณเคยรีวิวการจองนี้แล้ว',
        });
      }

      // สร้างรีวิว
      const result = await pool.query(`
        INSERT INTO Reviews (booking_id, rating, comment)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [booking_id, rating, comment]);

      console.log('✅ [createReview] สร้างรีวิวสำเร็จ');
      console.log('=====================================');

      res.status(201).json({
        success: true,
        message: 'เขียนรีวิวสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [createReview] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูรีวิวทั้งหมดของสินค้า (Public)
  async getProductReviews(req, res) {
    try {
      console.log('=====================================');
      console.log('⭐ [getProductReviews] เริ่มดึงรีวิว');

      const { id: product_id } = req.params;
      console.log('⭐ [getProductReviews] product_id:', product_id);

      // ตรวจสอบว่ามีสินค้านี้หรือไม่
      const productCheck = await pool.query(
        'SELECT product_id, title FROM Products WHERE product_id = $1',
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้า',
        });
      }

      // ดึงรีวิวทั้งหมด (JOIN ผ่าน Bookings)
      const result = await pool.query(`
        SELECT 
          r.review_id,
          r.booking_id,
          r.rating,
          r.comment,
          r.created_at,
          b.renter_id,
          u.full_name as reviewer_name
        FROM Reviews r
        INNER JOIN Bookings b ON r.booking_id = b.booking_id
        LEFT JOIN Users u ON b.renter_id = u.user_id
        WHERE b.product_id = $1
        ORDER BY r.created_at DESC
      `, [product_id]);

      // คำนวณค่าเฉลี่ย rating
      const avgRating = result.rows.length > 0
        ? (result.rows.reduce((sum, r) => sum + parseFloat(r.rating), 0) / result.rows.length).toFixed(2)
        : null;

      console.log('⭐ [getProductReviews] พบรีวิว:', result.rows.length);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลรีวิวสำเร็จ',
        product: {
          product_id: productCheck.rows[0].product_id,
          title: productCheck.rows[0].title,
          average_rating: avgRating,
        },
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ [getProductReviews] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // แก้ไขรีวิว
  async updateReview(req, res) {
    try {
      console.log('=====================================');
      console.log('⭐ [updateReview] เริ่มแก้ไขรีวิว');
      console.log('⭐ [updateReview] req.params:', req.params);
      console.log('⭐ [updateReview] req.body:', req.body);

      const { id: review_id } = req.params;
      const { rating, comment } = req.body;
      const user_id = req.user?.user_id || req.user?.id;

      // Validation
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาให้คะแนน 1-5 ดาว',
        });
      }

      // ตรวจสอบว่ารีวิวนี้เป็นของ User นี้หรือไม่ (ผ่าน Bookings)
      const reviewCheck = await pool.query(`
        SELECT r.review_id, r.booking_id
        FROM Reviews r
        INNER JOIN Bookings b ON r.booking_id = b.booking_id
        WHERE r.review_id = $1 AND b.renter_id = $2
      `, [review_id, user_id]);

      if (reviewCheck.rows.length === 0) {
        console.log('❌ [updateReview] ไม่พบรีวิวหรือไม่มีสิทธิ์');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'ไม่พบรีวิวหรือคุณไม่มีสิทธิ์',
        });
      }

      // อัพเดตรีวิว
      const result = await pool.query(`
        UPDATE Reviews
        SET 
          rating = COALESCE($1, rating),
          comment = COALESCE($2, comment)
        WHERE review_id = $3
        RETURNING *
      `, [rating, comment, review_id]);

      console.log('✅ [updateReview] แก้ไขรีวิวสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'แก้ไขรีวิวสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [updateReview] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ลบรีวิว
  async deleteReview(req, res) {
    try {
      console.log('=====================================');
      console.log('🗑️ [deleteReview] เริ่มลบรีวิว');

      const { id: review_id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;

      // ตรวจสอบว่ารีวิวนี้เป็นของ User นี้หรือไม่ (ผ่าน Bookings)
      const reviewCheck = await pool.query(`
        SELECT r.review_id
        FROM Reviews r
        INNER JOIN Bookings b ON r.booking_id = b.booking_id
        WHERE r.review_id = $1 AND b.renter_id = $2
      `, [review_id, user_id]);

      if (reviewCheck.rows.length === 0) {
        console.log('❌ [deleteReview] ไม่พบรีวิวหรือไม่มีสิทธิ์');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'ไม่พบรีวิวหรือคุณไม่มีสิทธิ์',
        });
      }

      // ลบรีวิว
      const result = await pool.query(
        'DELETE FROM Reviews WHERE review_id = $1 RETURNING *',
        [review_id]
      );

      console.log('✅ [deleteReview] ลบรีวิวสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ลบรีวิวสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [deleteReview] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new ReviewController();