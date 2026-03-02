const { pool } = require('../config/database');

class BookingController {
  // Shop Owner ดูการจองทั้งหมด
  async getShopBookings(req, res) {
    try {
      console.log('=====================================');
      console.log('📋 [getShopBookings] เริ่มดึงการจอง');
      console.log('📋 [getShopBookings] req.user:', req.user);

      const user_id = req.user?.user_id || req.user?.id;
      console.log('📋 [getShopBookings] user_id:', user_id);

      if (!user_id) {
        console.log('❌ [getShopBookings] ไม่มี user_id');
        console.log('=====================================');
        return res.status(401).json({
          success: false,
          message: 'กรุณา Login ก่อน',
        });
      }

      // หาร้านของ User
      const shopResult = await pool.query(
        'SELECT shop_id FROM Shops WHERE user_id = $1',
        [user_id]
      );

      if (shopResult.rows.length === 0) {
        console.log('❌ [getShopBookings] ไม่พบร้าน');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'คุณยังไม่มีร้าน',
        });
      }

      const shop_id = shopResult.rows[0].shop_id;
      console.log('📋 [getShopBookings] shop_id:', shop_id);

      // ดึงการจองทั้งหมด
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
          p.product_name,
          p.daily_rate,
          u.full_name as renter_name,
          u.email as renter_email
        FROM Bookings b
        LEFT JOIN Products p ON b.product_id = p.product_id
        LEFT JOIN Users u ON b.renter_id = u.user_id
        WHERE b.shop_id = $1
        ORDER BY b.created_at DESC
      `, [shop_id]);

      console.log('📋 [getShopBookings] พบการจอง:', result.rows.length);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลการจองสำเร็จ',
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ [getShopBookings] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // User ดูการจองของตัวเอง
  async getUserBookings(req, res) {
    try {
      console.log('=====================================');
      console.log('📋 [getUserBookings] เริ่มดึงการจอง');
      console.log('📋 [getUserBookings] req.user:', req.user);

      const user_id = req.user?.user_id || req.user?.id;
      console.log('📋 [getUserBookings] user_id:', user_id);

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
          p.product_name,
          p.daily_rate,
          s.shop_name
        FROM Bookings b
        LEFT JOIN Products p ON b.product_id = p.product_id
        LEFT JOIN Shops s ON b.shop_id = s.shop_id
        WHERE b.renter_id = $1
        ORDER BY b.created_at DESC
      `, [user_id]);

      console.log('📋 [getUserBookings] พบการจอง:', result.rows.length);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลการจองสำเร็จ',
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ [getUserBookings] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูการจองตาม ID
  async getBookingById(req, res) {
    try {
      console.log('=====================================');
      console.log('📋 [getBookingById] เริ่มดึงการจอง');

      const { id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;

      console.log('📋 [getBookingById] booking_id:', id);
      console.log('📋 [getBookingById] user_id:', user_id);

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
          p.product_name,
          p.daily_rate,
          s.shop_name,
          u.full_name as renter_name,
          u.email as renter_email
        FROM Bookings b
        LEFT JOIN Products p ON b.product_id = p.product_id
        LEFT JOIN Shops s ON b.shop_id = s.shop_id
        LEFT JOIN Users u ON b.renter_id = u.user_id
        WHERE b.booking_id = $1 AND b.renter_id = $2
      `, [id, user_id]);

      if (result.rows.length === 0) {
        console.log('❌ [getBookingById] ไม่พบการจอง');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจอง',
        });
      }

      console.log('✅ [getBookingById] พบการจอง');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลการจองสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [getBookingById] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // สร้างการจอง
  async createBooking(req, res) {
    try {
      console.log('=====================================');
      console.log('📋 [createBooking] เริ่มสร้างการจอง');
      console.log('📋 [createBooking] req.body:', req.body);
      console.log('📋 [createBooking] req.user:', req.user);

      const user_id = req.user?.user_id || req.user?.id;
      const { product_id, start_date, end_date } = req.body;

      // Validation
      if (!product_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        });
      }

      // ดึงข้อมูลสินค้า
      const productResult = await pool.query(`
        SELECT p.*, s.shop_id
        FROM Products p
        LEFT JOIN Shops s ON p.shop_id = s.shop_id
        WHERE p.product_id = $1
      `, [product_id]);

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้า',
        });
      }

      const product = productResult.rows[0];

      // คำนวณราคา
      const start = new Date(start_date);
      const end = new Date(end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const total_price = days * parseFloat(product.daily_rate);

      // สร้างการจอง
      const result = await pool.query(`
        INSERT INTO Bookings (
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
        product.deposit_amount,
      ]);

      console.log('✅ [createBooking] สร้างการจองสำเร็จ');
      console.log('=====================================');

      res.status(201).json({
        success: true,
        message: 'สร้างการจองสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [createBooking] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // อนุมัติการจอง
  async approveBooking(req, res) {
    try {
      console.log('=====================================');
      console.log('✅ [approveBooking] เริ่มอนุมัติการจอง');

      const { id } = req.params;
      const shop_id = req.shop?.shop_id;

      console.log('✅ [approveBooking] booking_id:', id);
      console.log('✅ [approveBooking] shop_id:', shop_id);

      const result = await pool.query(`
        UPDATE Bookings
        SET status = 'confirmed'
        WHERE booking_id = $1 AND shop_id = $2
        RETURNING *
      `, [id, shop_id]);

      if (result.rows.length === 0) {
        console.log('❌ [approveBooking] ไม่พบการจอง');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจอง',
        });
      }

      console.log('✅ [approveBooking] อนุมัติสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'อนุมัติการจองสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [approveBooking] Error:', error);
      console.log('=====================================');
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
      console.log('=====================================');
      console.log('❌ [rejectBooking] เริ่มปฏิเสธการจอง');

      const { id } = req.params;
      const shop_id = req.shop?.shop_id;

      console.log('❌ [rejectBooking] booking_id:', id);
      console.log('❌ [rejectBooking] shop_id:', shop_id);

      const result = await pool.query(`
        UPDATE Bookings
        SET status = 'rejected'
        WHERE booking_id = $1 AND shop_id = $2
        RETURNING *
      `, [id, shop_id]);

      if (result.rows.length === 0) {
        console.log('❌ [rejectBooking] ไม่พบการจอง');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจอง',
        });
      }

      console.log('✅ [rejectBooking] ปฏิเสธสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ปฏิเสธการจองสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [rejectBooking] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ยกเลิกการจอง (User)
  async cancelBooking(req, res) {
    try {
      console.log('=====================================');
      console.log('🚫 [cancelBooking] เริ่มยกเลิกการจอง');

      const { id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;

      console.log('🚫 [cancelBooking] booking_id:', id);
      console.log('🚫 [cancelBooking] user_id:', user_id);

      const result = await pool.query(`
        UPDATE Bookings
        SET status = 'cancelled'
        WHERE booking_id = $1 AND renter_id = $2 AND status = 'pending'
        RETURNING *
      `, [id, user_id]);

      if (result.rows.length === 0) {
        console.log('❌ [cancelBooking] ไม่พบการจองหรือไม่สามารถยกเลิกได้');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือไม่สามารถยกเลิกได้ (อาจอนุมัติแล้ว)',
        });
      }

      console.log('✅ [cancelBooking] ยกเลิกสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ยกเลิกการจองสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [cancelBooking] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // อัพเดตสถานะ "รับของแล้ว"
  async markAsPickedUp(req, res) {
    try {
      console.log('=====================================');
      console.log('📦 [markAsPickedUp] เริ่มอัพเดตสถานะ');

      const { id } = req.params;
      const shop_id = req.shop?.shop_id;

      console.log('📦 [markAsPickedUp] booking_id:', id);
      console.log('📦 [markAsPickedUp] shop_id:', shop_id);

      const result = await pool.query(`
        UPDATE Bookings
        SET status = 'picked_up'
        WHERE booking_id = $1 AND shop_id = $2 AND status = 'confirmed'
        RETURNING *
      `, [id, shop_id]);

      if (result.rows.length === 0) {
        console.log('❌ [markAsPickedUp] ไม่พบการจองหรือสถานะไม่ถูกต้อง');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือสถานะไม่ถูกต้อง',
        });
      }

      console.log('✅ [markAsPickedUp] อัพเดตสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'อัพเดตสถานะ "รับของแล้ว" สำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [markAsPickedUp] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // อัพเดตสถานะ "คืนของแล้ว"
  async markAsReturned(req, res) {
    try {
      console.log('=====================================');
      console.log('🔙 [markAsReturned] เริ่มอัพเดตสถานะ');

      const { id } = req.params;
      const shop_id = req.shop?.shop_id;

      console.log('🔙 [markAsReturned] booking_id:', id);
      console.log('🔙 [markAsReturned] shop_id:', shop_id);

      const result = await pool.query(`
        UPDATE Bookings
        SET status = 'completed'
        WHERE booking_id = $1 AND shop_id = $2 AND status = 'picked_up'
        RETURNING *
      `, [id, shop_id]);

      if (result.rows.length === 0) {
        console.log('❌ [markAsReturned] ไม่พบการจองหรือสถานะไม่ถูกต้อง');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือสถานะไม่ถูกต้อง',
        });
      }

      console.log('✅ [markAsReturned] อัพเดตสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'อัพเดตสถานะ "คืนของแล้ว" สำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [markAsReturned] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new BookingController();