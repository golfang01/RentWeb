const multer = require('multer');
const path = require('path');

// เก็บไว้ใน memory (สำหรับส่งต่อไป Cloudinary หรือ S3)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ (.jpg, .jpeg, .png, .webp) เท่านั้น'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

module.exports = upload;