const { pool } = require('../config/database');

class BookingController {
  // ดูคำขอเช่าทั้งหมดของร้าน
  async getShopBookings(req, res) {
    try {
      const shop_id = req.shop?.shop_id;
      const { status } = req.query;

      let query = `
        SELECT 
          b.*,
          p.product_name,
          p.daily_rate,
          p.deposit_amount,
          u.full_name as renter_name,
          u. email as renter_email,
          u.profile_image as renter_image
        FROM Bookings b
        JOIN Products p ON b.product_id = p.product_id
        JOIN Users u ON b.user_id = u.user_id
        WHERE p.shop_id = $1
      `;

      const params = [shop_id];

      if (status) {
        query += ` AND b.booking_status = $2`;
        params.push(status);
      }

      query += ` ORDER BY b.created_at DESC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ Get Shop Bookings Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error:  error.message,
      });
    }
  }

  // อนุมัติการจอง
  async approveBooking(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;

      // Check ownership
      const checkBooking = await pool.query(`
        SELECT b.*, p.shop_id
        FROM Bookings b
        JOIN Products p ON b.product_id = p.product_id
        WHERE b.booking_id = $1
      `, [id]);

      if (checkBooking.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจอง',
        });
      }

      const booking = checkBooking.rows[0];

      if (booking.shop_id !== shop_id) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์อนุมัติการจองนี้',
        });
      }

      if (booking.booking_status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'สถานะการจองไม่ถูกต้อง',
        });
      }

      // Update status
      const result = await pool.query(`
        UPDATE Bookings
        SET booking_status = 'waiting_payment'
        WHERE booking_id = $1
        RETURNING *
      `, [id]);

      res.json({
        success: true,
        message:  'อนุมัติการจองสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ Approve Booking Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ปฏิเสธการจอง
  async rejectBooking(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      const { reason } = req. body;

      // Check ownership (same as approve)
      const checkBooking = await pool.query(`
        SELECT b.*, p.shop_id
        FROM Bookings b
        JOIN Products p ON b.product_id = p.product_id
        WHERE b.booking_id = $1
      `, [id]);

      if (checkBooking.rows.length === 0 || checkBooking.rows[0].shop_id !== shop_id) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือคุณไม่มีสิทธิ์',
        });
      }

      const result = await pool.query(`
        UPDATE Bookings
        SET booking_status = 'rejected'
        WHERE booking_id = $1
        RETURNING *
      `, [id]);

      res.json({
        success: true,
        message: 'ปฏิเสธการจองสำเร็จ',
        data: result.rows[0],
        reason: reason || null,
      });
    } catch (error) {
      console.error('❌ Reject Booking Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error. message,
      });
    }
  }

  // อัปเดตสถานะเป็น "รับของแล้ว"
  async markAsPickedUp(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req. shop?.shop_id;

      const checkBooking = await pool.query(`
        SELECT b.*, p. shop_id
        FROM Bookings b
        JOIN Products p ON b.product_id = p. product_id
        WHERE b. booking_id = $1
      `, [id]);

      if (checkBooking.rows.length === 0 || checkBooking.rows[0].shop_id !== shop_id) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือคุณไม่มีสิทธิ์',
        });
      }

      const result = await pool.query(`
        UPDATE Bookings
        SET booking_status = 'active'
        WHERE booking_id = $1
        RETURNING *
      `, [id]);

      res.json({
        success: true,
        message: 'อัปเดตสถานะเป็น "กำลังเช่า" สำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ Mark Picked Up Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error. message,
      });
    }
  }

  // อัปเดตสถานะเป็น "คืนของแล้ว"
  async markAsReturned(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req. shop?.shop_id;

      const checkBooking = await pool. query(`
        SELECT b.*, p.shop_id
        FROM Bookings b
        JOIN Products p ON b.product_id = p.product_id
        WHERE b.booking_id = $1
      `, [id]);

      if (checkBooking.rows.length === 0 || checkBooking.rows[0].shop_id !== shop_id) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือคุณไม่มีสิทธิ์',
        });
      }

      const result = await pool.query(`
        UPDATE Bookings
        SET booking_status = 'completed'
        WHERE booking_id = $1
        RETURNING *
      `, [id]);

      // Update product availability
      await pool.query(`
        UPDATE Products
        SET availability_status = 'available'
        WHERE product_id = $1
      `, [checkBooking.rows[0].product_id]);

      res.json({
        success: true,
        message: 'อัปเดตสถานะเป็น "เสร็จสิ้น" สำเร็จ',
        data:  result.rows[0],
      });
    } catch (error) {
      console.error('❌ Mark Returned Error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new BookingController();