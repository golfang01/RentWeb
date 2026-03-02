const { pool } = require('../config/database');

class ProductController {
  // ลงสินค้าใหม่
  async createProduct(req, res) {
    try {
      console.log('=====================================');
      console.log('📦 [createProduct] เริ่มสร้างสินค้า');
      console.log('📦 [createProduct] req.shop:', req.shop);
      console.log('📦 [createProduct] req.body:', req.body);
      
      const shop_id = req.shop?.shop_id;
      console.log('📦 [createProduct] shop_id:', shop_id);
      
      const {
        title,
        description,
        category_id,
        price_per_day,
        deposit_amount,
        product_images,
      } = req.body;

      // Validation
      if (!title || !price_per_day || !deposit_amount) {
        console.log('❌ [createProduct] ข้อมูลไม่ครบ');
        console.log('=====================================');
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกชื่อสินค้า, ราคาเช่าต่อวัน, และค่ามัดจำ',
        });
      }

      const result = await pool.query(`
        INSERT INTO Products (
          shop_id, title, description, category_id,
          price_per_day, deposit_amount, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING *
      `, [shop_id, title, description, category_id, price_per_day, deposit_amount]);

      const product = result.rows[0];
      console.log('✅ [createProduct] สร้างสินค้าสำเร็จ:', product);

      // เพิ่มรูปภาพ (ถ้ามี)
      if (product_images && product_images.length > 0) {
        console.log('📸 [createProduct] กำลังเพิ่มรูปภาพ:', product_images.length, 'รูป');
        for (let i = 0; i < product_images.length; i++) {
          await pool.query(`
            INSERT INTO Product_Images (product_id, image_url, display_order)
            VALUES ($1, $2, $3)
          `, [product.product_id, product_images[i], i + 1]);
        }
        console.log('✅ [createProduct] เพิ่มรูปภาพสำเร็จ');
      }

      console.log('=====================================');
      res.status(201).json({
        success: true,
        message: 'ลงสินค้าสำเร็จ',
        data: product,
      });
    } catch (error) {
      console.error('❌ [createProduct] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูสินค้าในร้านตัวเอง
  async getMyProducts(req, res) {
    try {
      console.log('=====================================');
      console.log('📦 [getMyProducts] เริ่มดึงข้อมูลสินค้า');
      console.log('📦 [getMyProducts] req.shop:', req.shop);
      
      const shop_id = req.shop?.shop_id;
      console.log('📦 [getMyProducts] shop_id:', shop_id);

      if (!shop_id) {
        console.log('❌ [getMyProducts] ไม่พบ shop_id');
        console.log('=====================================');
        return res.status(500).json({
          success: false,
          message: 'ไม่พบข้อมูลร้าน',
        });
      }

      console.log('🔍 [getMyProducts] กำลัง Query database...');
      
      const result = await pool.query(`
        SELECT 
          p.*,
          p.title AS product_name,
          p.price_per_day AS daily_rate,
          p.status AS availability_status,
          c.category_name,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url, 'display_order', pi.display_order)
              ORDER BY pi.display_order
            ) FILTER (WHERE pi.image_id IS NOT NULL),
            '[]'
          ) as images
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.category_id
        LEFT JOIN Product_Images pi ON p.product_id = pi.product_id
        WHERE p.shop_id = $1
        GROUP BY p.product_id, c.category_name
        ORDER BY p.created_at DESC
      `, [shop_id]);

      console.log('✅ [getMyProducts] Query สำเร็จ');
      console.log('📦 [getMyProducts] จำนวนสินค้า:', result.rows.length);
      console.log('=====================================');

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('❌ [getMyProducts] Error:', error);
      console.error('❌ [getMyProducts] Error Stack:', error.stack);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูสินค้าตาม ID
  async getProductById(req, res) {
    try {
      console.log('=====================================');
      console.log('📦 [getProductById] เริ่มดึงสินค้าตาม ID');
      
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      
      console.log('📦 [getProductById] product_id:', id);
      console.log('📦 [getProductById] shop_id:', shop_id);

      const result = await pool.query(`
        SELECT 
          p.*,
          p.title AS product_name,
          p.price_per_day AS daily_rate,
          p.status AS availability_status,
          c.category_name,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url, 'display_order', pi.display_order)
              ORDER BY pi.display_order
            ) FILTER (WHERE pi.image_id IS NOT NULL),
            '[]'
          ) as images
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.category_id
        LEFT JOIN Product_Images pi ON p.product_id = pi.product_id
        WHERE p.product_id = $1 AND p.shop_id = $2
        GROUP BY p.product_id, c.category_name
      `, [id, shop_id]);

      console.log('📦 [getProductById] ผลลัพธ์:', result.rows);
      console.log('=====================================');

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้า',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [getProductById] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // แก้ไขสินค้า
  async updateProduct(req, res) {
    try {
      console.log('=====================================');
      console.log('📦 [updateProduct] เริ่มแก้ไขสินค้า');
      
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      
      console.log('📦 [updateProduct] product_id:', id);
      console.log('📦 [updateProduct] shop_id:', shop_id);
      console.log('📦 [updateProduct] req.body:', req.body);
      
      const {
        title,
        description,
        category_id,
        price_per_day,
        deposit_amount,
        status,
      } = req.body;

      // Check ownership
      const checkOwner = await pool.query(
        'SELECT product_id FROM Products WHERE product_id = $1 AND shop_id = $2',
        [id, shop_id]
      );

      console.log('📦 [updateProduct] Check ownership:', checkOwner.rows);

      if (checkOwner.rows.length === 0) {
        console.log('❌ [updateProduct] ไม่พบสินค้าหรือไม่มีสิทธิ์');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้าหรือคุณไม่มีสิทธิ์แก้ไข',
        });
      }

      // Build dynamic update
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (title !== undefined) {
        fields.push(`title = $${paramIndex}`);
        values.push(title);
        paramIndex++;
      }
      if (description !== undefined) {
        fields.push(`description = $${paramIndex}`);
        values.push(description);
        paramIndex++;
      }
      if (category_id !== undefined) {
        fields.push(`category_id = $${paramIndex}`);
        values.push(category_id);
        paramIndex++;
      }
      if (price_per_day !== undefined) {
        fields.push(`price_per_day = $${paramIndex}`);
        values.push(price_per_day);
        paramIndex++;
      }
      if (deposit_amount !== undefined) {
        fields.push(`deposit_amount = $${paramIndex}`);
        values.push(deposit_amount);
        paramIndex++;
      }
      if (status !== undefined) {
        fields.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }

      if (fields.length === 0) {
        console.log('❌ [updateProduct] ไม่มีข้อมูลที่จะแก้ไข');
        console.log('=====================================');
        return res.status(400).json({
          success: false,
          message: 'ไม่มีข้อมูลที่จะแก้ไข',
        });
      }

      values.push(id);
      const query = `
        UPDATE Products
        SET ${fields.join(', ')}
        WHERE product_id = $${paramIndex}
        RETURNING *
      `;

      console.log('📦 [updateProduct] Query:', query);
      console.log('📦 [updateProduct] Values:', values);

      const result = await pool.query(query, values);

      console.log('✅ [updateProduct] แก้ไขสำเร็จ:', result.rows[0]);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'แก้ไขสินค้าสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [updateProduct] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ลบสินค้า (Soft delete - เปลี่ยนเป็น inactive)
  async deleteProduct(req, res) {
    try {
      console.log('=====================================');
      console.log('📦 [deleteProduct] เริ่มลบสินค้า');
      
      const { id } = req.params;
      const shop_id = req.shop?.shop_id;
      
      console.log('📦 [deleteProduct] product_id:', id);
      console.log('📦 [deleteProduct] shop_id:', shop_id);

      const result = await pool.query(`
        UPDATE Products
        SET status = 'inactive'
        WHERE product_id = $1 AND shop_id = $2
        RETURNING *
      `, [id, shop_id]);

      console.log('📦 [deleteProduct] ผลลัพธ์:', result.rows);

      if (result.rows.length === 0) {
        console.log('❌ [deleteProduct] ไม่พบสินค้า');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้า',
        });
      }

      console.log('✅ [deleteProduct] ลบสำเร็จ');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ปิดการมองเห็นสินค้าสำเร็จ',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [deleteProduct] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }
}

module.exports = new ProductController();