const { pool } = require('../config/database');

module.exports = async (req, res, next) => {
  console.log("[requireShopAuth] run for", req.method, req.originalUrl);
  const user_id = req.user?.user_id || req.user?.id;
  if (!user_id) {
    console.log("[requireShopAuth] ไม่มี user_id");
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' });
  }

  const shopRes = await pool.query('SELECT shop_id FROM shops WHERE user_id = $1', [user_id]);
  if (!shopRes.rows.length) {
    console.log("[requireShopAuth] ไม่พบข้อมูลร้านค้าสำหรับ user นี้");
    return res.status(403).json({ success: false, message: 'คุณยังไม่มีร้าน' });
  }

  req.shop = { shop_id: shopRes.rows[0].shop_id };
  console.log("[requireShopAuth] req.shop:", req.shop);
  next();
};