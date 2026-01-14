require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

// Import config
const { testConnection } = require('./config/database');

// Import middlewares
const { errorHandler } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/users');
const shopRoutes = require('./routes/shopRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env. CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rentio API is running 🚀',
    timestamp:  new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ ไม่สามารถเชื่อมต่อ Database ได้');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Server กำลังทำงานที่ port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🏥 Health:  http://localhost:${PORT}/health`);
      console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('=================================');
      //  Debug: ตรวจสอบว่าอ่าน . env ได้หรือยัง
console.log('🔍 Environment Variables: ');
console.log('   DB_NAME:', process.env.DB_NAME || '❌ ไม่มีค่า');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ?  '✅ มีค่า' : '❌ ไม่มีค่า');
console.log('   PORT:', process.env.PORT || '❌ ไม่มีค่า');
console.log('');
    });
  } catch (error) {
    console.error('❌ ไม่สามารถเริ่ม Server ได้:', error);
    process.exit(1);
  }
};

startServer();