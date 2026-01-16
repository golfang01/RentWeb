const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '. env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env. CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app. get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rentio API is running 🚀',
    timestamp: new Date().toISOString(),
  });
});

// Routes API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categoryRoutes'));  

//  สำคัญ: Route ต้องเรียงจาก Specific → Dynamic
app.use('/api/shops/products', require('./routes/productRoutes'));      
app.use('/api/shops/bookings', require('./routes/bookingRoutes'));      
app.use('/api/shops', require('./routes/shopRoutes'));

// Error handler
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Cannot connect to database.  Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Server กำลังทำงานที่ port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process. env.NODE_ENV || 'development'}`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();