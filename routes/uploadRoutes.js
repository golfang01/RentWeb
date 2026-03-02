const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

// POST /api/upload/image — อัปโหลดรูปภาพ (คืน URL)
// ตอนนี้คืน placeholder URL — สามารถเพิ่ม Cloudinary ทีหลังได้
router.post('/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'กรุณาแนบไฟล์รูปภาพ' });
    }

    // TODO: อัปโหลดไป Cloudinary/S3 แล้วคืน URL จริง
    // ตัวอย่างชั่วคราว: ใช้ base64 หรือ local path
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    res.json({
      success: true,
      message: 'อัปโหลดรูปภาพสำเร็จ',
      data: {
        url: dataUrl, // เปลี่ยนเป็น Cloudinary URL ทีหลัง
        originalname: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

module.exports = router;