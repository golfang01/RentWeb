const { pool } = require('../config/database');

class PaymentController {
  // อัปโหลดสลิปการชำระเงิน (User)
  // POST /api/payments/:booking_id/slip
  async uploadSlip(req, res) {
    try {
      console.log('=====================================');
      console.log('💳 [uploadSlip] เริ่มอัปโหลดสลิป');

      const { booking_id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;
      const { slip_image_url } = req.body;

      if (!slip_image_url) {
        return res.status(400).json({ success: false, message: 'กรุณาแนบรูปสลิปการโอนเงิน' });
      }

      const bookingCheck = await pool.query(
        'SELECT booking_id, status, renter_id, total_price FROM Bookings WHERE booking_id = $1 AND renter_id = $2',
        [booking_id, user_id]
      );

      if (bookingCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
      }

      const booking = bookingCheck.rows[0];
      if (booking.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          message: `ไม่สามารถอัปโหลดสลิปได้ (สถานะปัจจุบัน: ${booking.status}) ต้องรอให้ร้านค้าอนุมัติก่อน`,
        });
      }

      const paymentResult = await pool.query(`
        INSERT INTO Payments (booking_id, payer_id, amount, payment_type, slip_image_url, payment_status)
        VALUES ($1, $2, $3, 'rental', $4, 'pending_verification')
        ON CONFLICT (booking_id, payment_type)
        DO UPDATE SET slip_image_url = EXCLUDED.slip_image_url, payment_status = 'pending_verification', updated_at = NOW()
        RETURNING *
      `, [booking_id, user_id, booking.total_price, slip_image_url]);

      await pool.query(`UPDATE Bookings SET status = 'waiting_verification' WHERE booking_id = $1`, [booking_id]);

      console.log('✅ [uploadSlip] อัปโหลดสลิปสำเร็จ');
      console.log('=====================================');

      res.status(201).json({ success: true, message: 'อัปโหลดสลิปสำเร็จ รอร้านค้าตรวจสอบ', data: paymentResult.rows[0] });
    } catch (error) {
      console.error('❌ [uploadSlip] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ร้านค้ายืนยันการรับเงิน
  // POST /api/payments/:booking_id/verify
  async verifyPayment(req, res) {
    try {
      const { booking_id } = req.params;
      const shop_id = req.shop?.shop_id;

      const bookingCheck = await pool.query(
        'SELECT booking_id, status FROM Bookings WHERE booking_id = $1 AND shop_id = $2',
        [booking_id, shop_id]
      );

      if (bookingCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบการจองหรือไม่มีสิทธิ์' });
      }
      if (bookingCheck.rows[0].status !== 'waiting_verification') {
        return res.status(400).json({ success: false, message: `ไม่สามารถยืนยันได้ (สถานะปัจจุบัน: ${bookingCheck.rows[0].status})` });
      }

      await pool.query(`UPDATE Payments SET payment_status = 'verified', updated_at = NOW() WHERE booking_id = $1`, [booking_id]);
      const result = await pool.query(`UPDATE Bookings SET status = 'confirmed' WHERE booking_id = $1 RETURNING *`, [booking_id]);

      res.json({ success: true, message: 'ยืนยันการชำระเงินสำเร็จ พร้อมส่งมอบสินค้า', data: result.rows[0] });
    } catch (error) {
      console.error('❌ [verifyPayment] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ร้านค้าปฏิเสธสลิป
  // POST /api/payments/:booking_id/reject
  async rejectPayment(req, res) {
    try {
      const { booking_id } = req.params;
      const shop_id = req.shop?.shop_id;
      const { reason } = req.body;

      const bookingCheck = await pool.query(
        'SELECT booking_id, status FROM Bookings WHERE booking_id = $1 AND shop_id = $2',
        [booking_id, shop_id]
      );

      if (bookingCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบการจองหรือไม่มีสิทธิ์' });
      }
      if (bookingCheck.rows[0].status !== 'waiting_verification') {
        return res.status(400).json({ success: false, message: 'ไม่สามารถปฏิเสธได้ในสถานะนี้' });
      }

      await pool.query(`UPDATE Payments SET payment_status = 'rejected', reject_reason = $2, updated_at = NOW() WHERE booking_id = $1`, [booking_id, reason || null]);
      const result = await pool.query(`UPDATE Bookings SET status = 'confirmed' WHERE booking_id = $1 RETURNING *`, [booking_id]);

      res.json({ success: true, message: 'ปฏิเสธสลิปสำเร็จ กรุณาแจ้งให้ผู้เช่าส่งสลิปใหม่', data: result.rows[0] });
    } catch (error) {
      console.error('❌ [rejectPayment] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ดูข้อมูล Payment ของการจอง
  // GET /api/payments/:booking_id
  async getPaymentByBooking(req, res) {
    try {
      const { booking_id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;

      const result = await pool.query(`
        SELECT pay.*, b.status AS booking_status, b.total_price, b.deposit_held, p.product_name, u.full_name AS payer_name
        FROM Payments pay
        JOIN Bookings b ON pay.booking_id = b.booking_id
        JOIN Products p ON b.product_id = p.product_id
        JOIN Users u ON pay.payer_id = u.user_id
        WHERE pay.booking_id = $1
          AND (b.renter_id = $2 OR b.shop_id IN (SELECT shop_id FROM Shops WHERE user_id = $2))
        ORDER BY pay.created_at DESC
      `, [booking_id, user_id]);

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('❌ [getPaymentByBooking] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new PaymentController();