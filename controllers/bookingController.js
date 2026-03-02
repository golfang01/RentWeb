const { pool } = require('../config/database');

class BookingController {

  // Helper: ดึง booking status ล่าสุด
  async getBookingStatus(booking_id) {
    const res = await pool.query('SELECT status FROM bookings WHERE booking_id = $1', [booking_id]);
    if (!res.rows.length) return null;
    return res.rows[0].status;
  }

  // ✅ User ดูการจองของตัวเอง
  async getUserBookings(req, res) {
    try {
      const user_id = req.user?.user_id || req.user?.id;
      const result = await pool.query(`
        SELECT b.*, p.title AS product_name, p.price_per_day AS daily_rate, s.shop_name
        FROM bookings b
        LEFT JOIN products p ON b.product_id = p.product_id
        LEFT JOIN shops    s ON b.shop_id    = s.shop_id
        WHERE b.renter_id = $1
        ORDER BY b.created_at DESC
      `, [user_id]);
      res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ Shop Owner ดูการจองทั้งหมด
  async getShopBookings(req, res) {
    try {
      const user_id = req.user?.user_id || req.user?.id;
      const shopResult = await pool.query('SELECT shop_id FROM shops WHERE user_id = $1', [user_id]);
      if (!shopResult.rows.length)
        return res.status(403).json({ success: false, message: 'คุณยังไม่มีร้าน' });

      const shop_id = shopResult.rows[0].shop_id;
      const result = await pool.query(`
        SELECT b.*, p.title AS product_name, p.price_per_day AS daily_rate, u.full_name AS renter_name, u.email AS renter_email
        FROM bookings b
        LEFT JOIN products p ON b.product_id = p.product_id
        LEFT JOIN users    u ON b.renter_id  = u.user_id
        WHERE b.shop_id = $1
        ORDER BY b.created_at DESC
      `, [shop_id]);
      res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ สร้างการจอง
  async createBooking(req, res) {
    try {
      const user_id = req.user?.user_id || req.user?.id;
      const { product_id, start_date, end_date } = req.body;
      if (!product_id || !start_date || !end_date)
        return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

      const productResult = await pool.query(`
        SELECT product_id, shop_id, price_per_day, deposit_amount, status
        FROM products WHERE product_id = $1
      `, [product_id]);
      if (!productResult.rows.length)
        return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
      const product = productResult.rows[0];

      if (product.status !== 'active' && product.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: `สินค้านี้ไม่พร้อมให้เช่า (สถานะ: ${product.status})`
        });
      }
      if (!product.shop_id)
        return res.status(400).json({ success: false, message: 'ไม่พบร้านค้าของสินค้านี้' });

      const start = new Date(start_date);
      const end   = new Date(end_date);
      const days  = Math.max(1, Math.ceil((end - start) / 86400000));
      const total_price  = days * parseFloat(product.price_per_day);
      const deposit_held = parseFloat(product.deposit_amount || 0);

      const result = await pool.query(`
        INSERT INTO bookings (
          product_id, renter_id, shop_id, start_date, end_date,
          total_price, deposit_held, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
        RETURNING *
      `, [
        product_id, user_id, product.shop_id,
        start_date, end_date, total_price, deposit_held,
      ]);
      res.status(201).json({
        success: true,
        message: 'สร้างการจองสำเร็จ รอเจ้าของร้านอนุมัติ',
        data: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ อนุมัติการจอง
  async approveBooking(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      // ตรวจสอบสถานะก่อน
      const status = await this.getBookingStatus(id);
      if (!status) return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
      if (status !== 'pending') {
        return res.status(400).json({ success: false, message: `อนุมัติได้เฉพาะสถานะ pending` });
      }
      const result = await pool.query(
        `UPDATE bookings SET status = 'approved' WHERE booking_id = $1 AND shop_id = $2 RETURNING *`,
        [id, shop_id]
      );
      if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
      res.json({ success: true, message: 'อนุมัติการจองสำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ ปฏิเสธการจอง
  async rejectBooking(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      // ตรวจสอบสถานะก่อน
      const status = await this.getBookingStatus(id);
      if (!status) return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
      if (['cancelled', 'approved', 'picked_up', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: `ไม่สามารถปฏิเสธได้เนื่องจากสถานะปัจจุบัน ${status}` });
      }
      const result = await pool.query(
        `UPDATE bookings SET status = 'rejected' WHERE booking_id = $1 AND shop_id = $2 RETURNING *`,
        [id, shop_id]
      );
      if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
      res.json({ success: true, message: 'ปฏิเสธการจองสำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ ยกเลิกการจอง
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;
      // ตรวจสอบสถานะก่อน
      const status = await this.getBookingStatus(id);
      if (!status) return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
      if (['cancelled', 'rejected', 'picked_up', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: `ไม่สามารถยกเลิกได้เนื่องจากสถานะปัจจุบัน ${status}` });
      }
      const result = await pool.query(
        `UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1 AND renter_id = $2 RETURNING *`,
        [id, user_id]
      );
      if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง หรือคุณไม่มีสิทธิ์ยกเลิก' });
      res.json({ success: true, message: 'ยกเลิกการจองสำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ ดูรายละเอียดการจอง
async getBookingById(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user?.user_id || req.user?.id;
    // ตัวอย่าง query:
    const result = await pool.query(`
      SELECT b.*, p.title AS product_name, p.price_per_day AS daily_rate, s.shop_name
      FROM bookings b
      LEFT JOIN products p ON b.product_id = p.product_id
      LEFT JOIN shops s ON b.shop_id = s.shop_id
      WHERE b.booking_id = $1 AND b.renter_id = $2
    `, [id, user_id]);
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
}

  // ✅ รับของแล้ว
  async markAsPickedUp(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      // ตรวจสอบสถานะก่อน
      const status = await this.getBookingStatus(id);
      if (!status) return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
      if (['cancelled', 'rejected', 'completed', 'picked_up'].includes(status)) {
        return res.status(400).json({ success: false, message: `ไม่สามารถรับของได้ : สถานะปัจจุบัน ${status}` });
      }
      if (status !== 'approved' && status !== 'confirmed') {
        return res.status(400).json({ success: false, message: `ร���บของได้เฉพาะ booking ที่ approved/confirmed เท่านั้น (ปัจจุบัน ${status})` });
      }
      const result = await pool.query(
        `UPDATE bookings SET status = 'picked_up' WHERE booking_id = $1 AND shop_id = $2 RETURNING *`,
        [id, shop_id]
      );
      if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง หรือสิทธิ์ไม่ถูกต้อง' });
      res.json({ success: true, message: 'อัปเดตสถานะรับของแล้วสำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ คืนของแล้ว
  async markAsReturned(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      // ตรวจสอบสถานะก่อน
      const status = await this.getBookingStatus(id);
      if (!status) return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
      if (['cancelled', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: `ไม่สามารถคืนของได้เนื่องจากสถานะเป็น ${status}` });
      }
      if (status !== 'picked_up') {
        return res.status(400).json({ success: false, message: `คืนของได้เฉพาะ booking ที่ picked_up เท่านั้น (ปัจจุบัน ${status})` });
      }
      const result = await pool.query(
        `UPDATE bookings SET status = 'completed' WHERE booking_id = $1 AND shop_id = $2 RETURNING *`,
        [id, shop_id]
      );
      if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง หรือสิทธิ์ไม่ถูกต้อง' });
      res.json({ success: true, message: 'คืนของแล้วสำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new BookingController();