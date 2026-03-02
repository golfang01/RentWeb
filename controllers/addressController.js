const { pool } = require('../config/database');

class AddressController {
  // เพิ่มที่อยู่
  async createAddress(req, res) {
    try {
      console.log('=====================================');
      console.log('📍 [createAddress] เริ่มสร้างที่อยู่');
      console.log('📍 [createAddress] req.body:', req.body);

      const user_id = req.user?.user_id || req.user?.id;
      const { 
        recipient_name,
        phone_number,
        address_line, 
        province, 
        postal_code, 
        is_default 
      } = req.body;

      // Validation
      if (!address_line || !province || !postal_code) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน',
        });
      }

      // ถ้าตั้งเป็นที่อยู่หลัก ให้ยกเลิกที่อยู่หลักเดิม
      if (is_default === true) {
        await pool.query(
          'UPDATE User_Addresses SET is_default = false WHERE user_id = $1',
          [user_id]
        );
      }

      // สร้างที่อยู่
      const result = await pool.query(`
        INSERT INTO User_Addresses (
          user_id, 
          recipient_name,
          phone_number,
          address_line, 
          province, 
          postal_code, 
          is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        user_id,
        recipient_name,
        phone_number,
        address_line,
        province,
        postal_code,
        is_default || false
      ]);

      console.log('✅ [createAddress] สร้างที่อยู่สำเร็จ');
      console.log('=====================================');

      res.status(201).json({
        success: true,
        message: 'เพิ่มที่อยู่สำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [createAddress] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูที่อยู่ทั้งหมด
  async getAddresses(req, res) {
    try {
      console.log('=====================================');
      console.log('📍 [getAddresses] เริ่มดึงที่อยู่');

      const user_id = req.user?.user_id || req.user?.id;

      const result = await pool.query(`
        SELECT *
        FROM User_Addresses
        WHERE user_id = $1
        ORDER BY is_default DESC, address_id DESC
      `, [user_id]);

      console.log('📍 [getAddresses] พบที่อยู่:', result.rows.length);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลที่อยู่สำเร็จ',
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ [getAddresses] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูที่อยู่ตาม ID
  async getAddressById(req, res) {
    try {
      console.log('=====================================');
      console.log('📍 [getAddressById] เริ่มดึงที่อยู่');

      const { id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;

      const result = await pool.query(
        'SELECT * FROM User_Addresses WHERE address_id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (result.rows.length === 0) {
        console.log('❌ [getAddressById] ไม่พบที่อยู่');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบที่อยู่',
        });
      }

      console.log('✅ [getAddressById] พบที่อยู่');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลที่อยู่สำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [getAddressById] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // แก้ไขที่อยู่
  async updateAddress(req, res) {
    try {
      console.log('=====================================');
      console.log('���� [updateAddress] เริ่มแก้ไขที่อยู่');
      console.log('📍 [updateAddress] req.params:', req.params);
      console.log('📍 [updateAddress] req.body:', req.body);

      const { id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;
      const { 
        recipient_name,
        phone_number,
        address_line, 
        province, 
        postal_code
      } = req.body;

      // ตรวจสอบว่าที่อยู่นี้เป็นของ User นี้หรือไม่
      const addressCheck = await pool.query(
        'SELECT address_id FROM User_Addresses WHERE address_id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (addressCheck.rows.length === 0) {
        console.log('❌ [updateAddress] ไม่พบที่อยู่หรือไม่มีสิทธิ์');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์',
        });
      }

      // อัพเดตที่อยู่
      const result = await pool.query(`
        UPDATE User_Addresses
        SET 
          recipient_name = COALESCE($1, recipient_name),
          phone_number = COALESCE($2, phone_number),
          address_line = COALESCE($3, address_line),
          province = COALESCE($4, province),
          postal_code = COALESCE($5, postal_code)
        WHERE address_id = $6
        RETURNING *
      `, [recipient_name, phone_number, address_line, province, postal_code, id]);

      console.log('✅ [updateAddress] แก้ไขที่อยู่สำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'แก้ไขที่อยู่สำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [updateAddress] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ตั้งที่อยู่หลัก
  async setDefaultAddress(req, res) {
    try {
      console.log('=====================================');
      console.log('📍 [setDefaultAddress] เริ่มตั้งที่อยู่หลัก');

      const { id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;

      // ตรวจสอบว่าที่อยู่นี้เป็นของ User นี้หรือไม่
      const addressCheck = await pool.query(
        'SELECT address_id FROM User_Addresses WHERE address_id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (addressCheck.rows.length === 0) {
        console.log('❌ [setDefaultAddress] ไม่พบที่อยู่หรือไม่มีสิทธิ์');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์',
        });
      }

      // ยกเลิกที่อยู่หลักเดิม
      await pool.query(
        'UPDATE User_Addresses SET is_default = false WHERE user_id = $1',
        [user_id]
      );

      // ตั้งที่อยู่หลักใหม่
      const result = await pool.query(
        'UPDATE User_Addresses SET is_default = true WHERE address_id = $1 RETURNING *',
        [id]
      );

      console.log('✅ [setDefaultAddress] ตั้งที่อยู่หลักสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ตั้งที่อยู่หลักสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [setDefaultAddress] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ลบที่อยู่
  async deleteAddress(req, res) {
    try {
      console.log('=====================================');
      console.log('🗑️ [deleteAddress] เริ่มลบที่อยู่');

      const { id } = req.params;
      const user_id = req.user?.user_id || req.user?.id;

      // ตรวจสอบว่าที่อยู่นี้เป็นของ User นี้หรือไม่
      const addressCheck = await pool.query(
        'SELECT address_id FROM User_Addresses WHERE address_id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (addressCheck.rows.length === 0) {
        console.log('❌ [deleteAddress] ไม่พบที่อยู่หรือไม่มีสิทธิ์');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์',
        });
      }

      // ลบที่อยู่
      const result = await pool.query(
        'DELETE FROM User_Addresses WHERE address_id = $1 RETURNING *',
        [id]
      );

      console.log('✅ [deleteAddress] ลบที่อยู่สำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ลบที่อยู่สำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [deleteAddress] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new AddressController();