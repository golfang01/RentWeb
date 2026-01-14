const { pool } = require('../config/database');

// Middleware ตรวจสอบว่าผู้ใช้มีร้านค้าหรือไม่
const requireShop = async (req, res, next) => {
    try {
        // ⭐ Debug Log 1: เช็คว่ามี req.user หรือไม่
        console.log('=====================================');
        console.log('🔍 [requireShop] เริ่มตรวจสอบร้านค้า');
        console.log('🔍 [requireShop] req.user:', req.user);
        
        const user_id = req. user?. user_id;  // ⭐ เปลี่ยนเป็�� optional chaining
        
        // ⭐ Debug Log 2: เช็ค user_id
        console.log('🔍 [requireShop] user_id:', user_id);

        // ⭐ เช็คว่ามี user_id หรือไม่
        if (!user_id) {
            console.log('❌ [requireShop] ไม่พบ user_id');
            return res.status(401).json({
                success: false,
                message: 'กรุณา Login ก่อน',
            });
        }

        const result = await pool.query(`
            SELECT shop_id, shop_name, user_id
            FROM Shops
            WHERE user_id = $1
        `, [user_id]);

        // ⭐ Debug Log 3: ดูผลลัพธ์จาก Database
        console.log('🔍 [requireShop] Query result:', result.rows);
        console.log('🔍 [requireShop] จำนวนร้านที่พบ:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('❌ [requireShop] ไม่พบร้านค้าของ user_id:', user_id);
            console.log('=====================================');
            return res.status(403).json({
                success: false,
                message: 'คุณไม่มีร้านค้า ไม่สามารถดำเนินการนี้ได้หรือสร้างร้านค้าก่อน',
            });
        }

        // เก็บข้อมูลร้านค้าใน req.shop
        req. shop = result.rows[0];
        
        // ⭐ Debug Log 4: ร้านที่พบ
        console.log('✅ [requireShop] พบร้านค้า:', {
            shop_id: req. shop.shop_id,
            shop_name: req.shop. shop_name,
            user_id: req.shop.user_id
        });
        console.log('=====================================');
        
        next();
    } catch (error) {
        console.error('❌ [requireShop] Error:', error);
        console.log('=====================================');
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการตรวจสอบร้านค้า',
            error: error.message,
        });
    }
};

module.exports = { requireShop };