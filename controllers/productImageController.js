const { pool } = require('../config/database');

class ProductImageController {
  // เพิ่มรูปภาพสินค้า
  async addProductImage(req, res) {
    try {
      console.log('=====================================');
      console.log('🖼️ [addProductImage] เริ่มเพิ่มรูปภาพ');
      console.log('🖼️ [addProductImage] req.body:', req.body);
      console.log('🖼️ [addProductImage] req.params:', req.params);

      const { id: product_id } = req.params;
      const { image_url, is_primary } = req.body;
      const shop_id = req.shop?.shop_id;

      // Validation
      if (!image_url) {
        console.log('❌ [addProductImage] ไม่มี image_url');
        console.log('=====================================');
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุ URL รูปภาพ',
        });
      }

      // ตรวจสอบว่าสินค้าเป็นของร้านนี้หรือไม่
      const productCheck = await pool.query(
        'SELECT product_id FROM Products WHERE product_id = $1 AND shop_id = $2',
        [product_id, shop_id]
      );

      if (productCheck.rows.length === 0) {
        console.log('❌ [addProductImage] ไม่พบสินค้าหรือไม่มีสิทธิ์');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'ไม่พบสินค้าหรือคุณไม่มีสิทธิ์',
        });
      }

      // ถ้าต้องการตั้งเป็นรูปหลัก ให้ยกเลิกรูปหลักเดิมก่อน
      if (is_primary === true) {
        await pool.query(
          'UPDATE Product_Images SET is_primary = false WHERE product_id = $1',
          [product_id]
        );
      }

      // เพิ่มรูปภาพ
      const result = await pool.query(`
        INSERT INTO Product_Images (product_id, image_url, is_primary)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [product_id, image_url, is_primary || false]);

      console.log('✅ [addProductImage] เพิ่มรูปภาพสำเร็จ');
      console.log('=====================================');

      res.status(201).json({
        success: true,
        message: 'เพิ่มรูปภาพสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [addProductImage] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูรูปภาพทั้งหมดของสินค้า
  async getProductImages(req, res) {
    try {
      console.log('=====================================');
      console.log('🖼️ [getProductImages] เริ่มดึงรูปภาพ');

      const { id: product_id } = req.params;
      console.log('🖼️ [getProductImages] product_id:', product_id);

      // ตรวจสอบว่ามีสินค้านี้หรือไม่
      const productCheck = await pool.query(
        'SELECT product_id FROM Products WHERE product_id = $1',
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        console.log('❌ [getProductImages] ไม่พบสินค้า');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้า',
        });
      }

      // ดึงรูปภาพทั้งหมด (รูปหลักก่อน) - ⭐ ลบ created_at ออก
      const result = await pool.query(`
        SELECT 
          image_id,
          product_id,
          image_url,
          is_primary
        FROM Product_Images
        WHERE product_id = $1
        ORDER BY is_primary DESC, image_id ASC
      `, [product_id]);

      console.log('🖼️ [getProductImages] พบรูปภาพ:', result.rows.length);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลรูปภาพสำเร็จ',
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ [getProductImages] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ตั้งรูปหลัก
  async setPrimaryImage(req, res) {
    try {
      console.log('=====================================');
      console.log('🖼️ [setPrimaryImage] เริ่มตั้งรูปหลัก');
      console.log('🖼️ [setPrimaryImage] req.params:', req.params);

      const { id: product_id, imageId } = req.params;
      const shop_id = req.shop?.shop_id;

      // ตรวจสอบสิทธิ์
      const productCheck = await pool.query(
        'SELECT product_id FROM Products WHERE product_id = $1 AND shop_id = $2',
        [product_id, shop_id]
      );

      if (productCheck.rows.length === 0) {
        console.log('❌ [setPrimaryImage] ไม่มีสิทธิ์');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์แก้ไขรูปภาพนี้',
        });
      }

      // ยกเลิกรูปหลักเดิม
      await pool.query(
        'UPDATE Product_Images SET is_primary = false WHERE product_id = $1',
        [product_id]
      );

      // ตั้งรูปหลักใหม่
      const result = await pool.query(`
        UPDATE Product_Images
        SET is_primary = true
        WHERE image_id = $1 AND product_id = $2
        RETURNING *
      `, [imageId, product_id]);

      if (result.rows.length === 0) {
        console.log('❌ [setPrimaryImage] ไม่พบรูปภาพ');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรูปภาพ',
        });
      }

      console.log('✅ [setPrimaryImage] ตั้งรูปหลักสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ตั้งรูปหลักสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [setPrimaryImage] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ลบรูปภาพ
  async deleteProductImage(req, res) {
    try {
      console.log('=====================================');
      console.log('🗑️ [deleteProductImage] เริ่มลบรูปภาพ');
      console.log('🗑️ [deleteProductImage] req.params:', req.params);

      const { id: product_id, imageId } = req.params;
      const shop_id = req.shop?.shop_id;

      // ตรวจสอบสิทธิ์
      const productCheck = await pool.query(
        'SELECT product_id FROM Products WHERE product_id = $1 AND shop_id = $2',
        [product_id, shop_id]
      );

      if (productCheck.rows.length === 0) {
        console.log('❌ [deleteProductImage] ไม่มีสิทธิ���');
        console.log('=====================================');
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ลบรูปภาพนี้',
        });
      }

      // ลบรูปภาพ
      const result = await pool.query(`
        DELETE FROM Product_Images
        WHERE image_id = $1 AND product_id = $2
        RETURNING *
      `, [imageId, product_id]);

      if (result.rows.length === 0) {
        console.log('❌ [deleteProductImage] ไม่พบรูปภาพ');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรูปภาพ',
        });
      }

      console.log('✅ [deleteProductImage] ลบรูปภาพสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ลบรูปภาพสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [deleteProductImage] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new ProductImageController();