const { pool } = require('../config/database');

class BookingController {

  // ✅ User ดูการจองของตัวเอง
  async getUserBookings(req, res) {
    try {
      const user_id = req.user?.user_id || req.user?.id;
      console.log('📋 getUserBookings user_id:', user_id);

      const result = await pool.query(`
        SELECT
          b.booking_id,
          b.product_id,
          b.renter_id,
          b.shop_id,
          b.start_date,
          b.end_date,
          b.total_price,
          b.deposit_held,
          b.status,
          b.created_at,
          p.title          AS product_name,
          p.price_per_day  AS daily_rate,
          s.shop_name
        FROM bookings b
        LEFT JOIN products p ON b.product_id = p.product_id
        LEFT JOIN shops    s ON b.shop_id    = s.shop_id
        WHERE b.renter_id = $1
        ORDER BY b.created_at DESC
      `, [user_id]);

      console.log('📋 bookings found:', result.rows.length);
      res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      console.error('❌ getUserBookings Error:', error.message);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ Shop Owner ดูการจองทั้งหมด
  async getShopBookings(req, res) {
    try {
      const user_id = req.user?.user_id || req.user?.id;
      const shopResult = await pool.query(
        'SELECT shop_id FROM shops WHERE user_id = $1', [user_id]
      );
      if (shopResult.rows.length === 0)
        return res.status(403).json({ success: false, message: 'คุณยังไม่มีร้าน' });

      const shop_id = shopResult.rows[0].shop_id;
      const result = await pool.query(`
        SELECT
          b.booking_id,
          b.product_id,
          b.renter_id,
          b.shop_id,
          b.start_date,
          b.end_date,
          b.total_price,
          b.deposit_held,
          b.status,
          b.created_at,
          p.title          AS product_name,
          p.price_per_day  AS daily_rate,
          u.full_name      AS renter_name,
          u.email          AS renter_email
        FROM bookings b
        LEFT JOIN products p ON b.product_id = p.product_id
        LEFT JOIN users    u ON b.renter_id  = u.user_id
        WHERE b.shop_id = $1
        ORDER BY b.created_at DESC
      `, [shop_id]);

      res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      console.error('❌ getShopBookings Error:', error.message);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ ดูการจองตาม ID
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;

      const result = await pool.query(`
        SELECT
          b.booking_id,
          b.product_id,
          b.renter_id,
          b.shop_id,
          b.start_date,
          b.end_date,
          b.total_price,
          b.deposit_held,
          b.status,
          b.created_at,
          p.title          AS product_name,
          p.price_per_day  AS daily_rate,
          s.shop_name,
          u.full_name      AS renter_name,
          u.email          AS renter_email
        FROM bookings b
        LEFT JOIN products p ON b.product_id = p.product_id
        LEFT JOIN shops    s ON b.shop_id    = s.shop_id
        LEFT JOIN users    u ON b.renter_id  = u.user_id
        WHERE b.booking_id = $1 AND b.renter_id = $2
      `, [id, user_id]);

      if (result.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('❌ getBookingById Error:', error.message);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ สร้างการจอง
  async createBooking(req, res) {
    try {
      console.log('📋 [createBooking] body:', req.body);
      console.log('📋 [createBooking] user:', req.user);

      const user_id = req.user?.user_id || req.user?.id;
      const { product_id, start_date, end_date } = req.body;

      if (!product_id || !start_date || !end_date)
        return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

      // ✅ ดึง column ที่มีจริงใน products
      const productResult = await pool.query(`
        SELECT
          product_id,
          shop_id,
          price_per_day,
          deposit_amount,
          status
        FROM products
        WHERE product_id = $1
      `, [product_id]);

      if (productResult.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });

      const product = productResult.rows[0];
      console.log('📋 product:', product);

      // เช็คสถานะ (status enum: 'active')
      if (product.status !== 'active' && product.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: `สินค้านี้ไม่พร้อมให้เช่า (สถานะ: ${product.status})`
        });
      }

      if (!product.shop_id)
        return res.status(400).json({ success: false, message: 'ไม่พบร้านค้าของสินค้านี้' });

      // คำนวณราคา
      const start = new Date(start_date);
      const end   = new Date(end_date);
      const days  = Math.max(1, Math.ceil((end - start) / 86400000));
      const total_price  = days * parseFloat(product.price_per_day);
      const deposit_held = parseFloat(product.deposit_amount || 0);

      console.log('📋 days:', days, 'rate:', product.price_per_day, 'total:', total_price);

      // ✅ INSERT ตาม column จริงใน bookings
      const result = await pool.query(`
        INSERT INTO bookings (
          product_id,
          renter_id,
          shop_id,
          start_date,
          end_date,
          total_price,
          deposit_held,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *
      `, [
        product_id,
        user_id,
        product.shop_id,
        start_date,
        end_date,
        total_price,
        deposit_held,
      ]);

      console.log('✅ [createBooking] booking_id:', result.rows[0].booking_id);
      res.status(201).json({
        success: true,
        message: 'สร้างการจองสำเร็จ รอเจ้าของร้านอนุมัติ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [createBooking] Error:', error.message);
      console.error('❌ [createBooking] Stack:', error.stack);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ อนุมัติการจอง
  async approveBooking(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      const result = await pool.query(
        `UPDATE bookings SET status = 'confirmed'
         WHERE booking_id = $1 AND shop_id = $2
         RETURNING *`,
        [id, shop_id]
      );
      if (result.rows.length === 0)
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
      const result = await pool.query(
        `UPDATE bookings SET status = 'rejected'
         WHERE booking_id = $1 AND shop_id = $2
         RETURNING *`,
        [id, shop_id]
      );
      if (result.rows.length === 0)
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
      const result = await pool.query(
        `UPDATE bookings SET status = 'cancelled'
         WHERE booking_id = $1 AND renter_id = $2 AND status = 'pending'
         RETURNING *`,
        [id, user_id]
      );
      if (result.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง หรือไม่สามารถยกเลิกได้' });
      res.json({ success: true, message: 'ยกเลิกการจองสำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ รับของแล้ว
  async markAsPickedUp(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      const result = await pool.query(
        `UPDATE bookings SET status = 'picked_up'
         WHERE booking_id = $1 AND shop_id = $2 AND status = 'confirmed'
         RETURNING *`,
        [id, shop_id]
      );
      if (result.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง หรือสถานะไม่ถูกต้อง' });
      res.json({ success: true, message: 'อัปเดตสถานะ "รับของแล้ว" สำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // ✅ คืนของแล้ว
  async markAsReturned(req, res) {
    try {
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      const result = await pool.query(
        `UPDATE bookings SET status = 'completed'
         WHERE booking_id = $1 AND shop_id = $2 AND status = 'picked_up'
         RETURNING *`,
        [id, shop_id]
      );
      if (result.rows.length === 0)
        return res.status(404).json({ success: false, message: 'ไม่พบการจอง หรือสถานะไม่ถูกต้อง' });
      res.json({ success: true, message: 'อัปเดตสถานะ "คืนของแล้ว" สำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new BookingController();