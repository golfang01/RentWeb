const { pool } = require('../config/database');

class PublicProductController {
  // ดูสินค้าทั้งหมด (Public)
  async getAllProducts(req, res) {
    try {
      console.log('=====================================');
      console.log('🔍 [getAllProducts] เริ่มดึงสินค้า');
      console.log('🔍 [getAllProducts] req.query:', req.query);

      const {
        search,           // ค้นหาชื่อสินค้า
        category_id,      // กรองหมวดหมู่
        min_price,        // ราคาต่ำสุด
        max_price,        // ราคาสูงสุด
        shop_id,          // กรองร้าน
        sort = 'newest',  // เรียงลำดับ (newest, price_asc, price_desc, rating)
        page = 1,         // หน้าที่
        limit = 20        // จำนวนต่อหน้า
      } = req.query;

      // สร้าง WHERE conditions
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // สินค้าต้อง active เท่านั้น
      conditions.push(`p.status = 'active'`);

      // Search
      if (search) {
        conditions.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Filter by category
      if (category_id) {
        conditions.push(`p.category_id = $${paramIndex}`);
        params.push(category_id);
        paramIndex++;
      }

      // Filter by shop
      if (shop_id) {
        conditions.push(`p.shop_id = $${paramIndex}`);
        params.push(shop_id);
        paramIndex++;
      }

      // Filter by price range
      if (min_price) {
        conditions.push(`p.price_per_day >= $${paramIndex}`);
        params.push(min_price);
        paramIndex++;
      }

      if (max_price) {
        conditions.push(`p.price_per_day <= $${paramIndex}`);
        params.push(max_price);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Sort
      let orderBy = 'p.created_at DESC'; // default: newest
      if (sort === 'price_asc') orderBy = 'p.price_per_day ASC';
      if (sort === 'price_desc') orderBy = 'p.price_per_day DESC';
      if (sort === 'rating') orderBy = 'avg_rating DESC NULLS LAST';

      // Pagination
      const offset = (page - 1) * limit;

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM Products p
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get products with images and rating
      const query = `
        SELECT 
          p.product_id,
          p.shop_id,
          p.category_id,
          p.title,
          p.description,
          p.price_per_day,
          p.deposit_amount,
          p.buffer_days,
          p.status,
          p.created_at,
          s.shop_name,
          c.name as category_name,
          
          -- รูปหลัก
          (
            SELECT image_url 
            FROM Product_Images 
            WHERE product_id = p.product_id AND is_primary = true 
            LIMIT 1
          ) as primary_image,
          
          -- คะแนนเฉลี่ย
          (
            SELECT AVG(r.rating)::NUMERIC(3,2)
            FROM Reviews r
            INNER JOIN Bookings b ON r.booking_id = b.booking_id
            WHERE b.product_id = p.product_id
          ) as avg_rating,
          
          -- จำนวนรีวิว
          (
            SELECT COUNT(*)
            FROM Reviews r
            INNER JOIN Bookings b ON r.booking_id = b.booking_id
            WHERE b.product_id = p.product_id
          ) as review_count
          
        FROM Products p
        LEFT JOIN Shops s ON p.shop_id = s.shop_id
        LEFT JOIN Categories c ON p.category_id = c.category_id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      console.log('🔍 [getAllProducts] พบสินค้า:', result.rows.length);
      console.log('🔍 [getAllProducts] ทั้งหมด:', total);
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลสินค้าสำเร็จ',
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('❌ [getAllProducts] Error:', error);
      console.log('=====================================');
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด',
        error: error.message,
      });
    }
  }

  // ดูสินค้าตาม ID (Public)
  async getProductById(req, res) {
    try {
      console.log('=====================================');
      console.log('🔍 [getProductById] เริ่มดึงสินค้า');

      const { id } = req.params;
      console.log('🔍 [getProductById] product_id:', id);

      // Get product details
      const productQuery = `
        SELECT 
          p.product_id,
          p.shop_id,
          p.category_id,
          p.title,
          p.description,
          p.price_per_day,
          p.deposit_amount,
          p.buffer_days,
          p.status,
          p.created_at,
          s.shop_name,
          s.phone as shop_phone,
          s.address as shop_address,
          c.name as category_name,
          
          -- คะแนนเฉลี่ย
          (
            SELECT AVG(r.rating)::NUMERIC(3,2)
            FROM Reviews r
            INNER JOIN Bookings b ON r.booking_id = b.booking_id
            WHERE b.product_id = p.product_id
          ) as avg_rating,
          
          -- จำนวนรีวิว
          (
            SELECT COUNT(*)
            FROM Reviews r
            INNER JOIN Bookings b ON r.booking_id = b.booking_id
            WHERE b.product_id = p.product_id
          ) as review_count
          
        FROM Products p
        LEFT JOIN Shops s ON p.shop_id = s.shop_id
        LEFT JOIN Categories c ON p.category_id = c.category_id
        WHERE p.product_id = $1
      `;

      const productResult = await pool.query(productQuery, [id]);

      if (productResult.rows.length === 0) {
        console.log('❌ [getProductById] ไม่พบสินค้า');
        console.log('=====================================');
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสินค้า',
        });
      }

      // Get images
      const imagesQuery = `
        SELECT image_id, image_url, is_primary
        FROM Product_Images
        WHERE product_id = $1
        ORDER BY is_primary DESC, image_id ASC
      `;

      const imagesResult = await pool.query(imagesQuery, [id]);

      // Combine data
      const product = {
        ...productResult.rows[0],
        images: imagesResult.rows,
      };

      console.log('✅ [getProductById] พบสินค้า');
      console.log('=====================================');

      res.json({
        success: true,
        message: 'ดึงข้อมูลสินค้าสำเร็จ',
        data: product,
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
}

module.exports = new PublicProductController();