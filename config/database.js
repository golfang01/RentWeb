const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env. DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🕐 Database time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error. message);
    return false;
  }
};

module.exports = { pool, testConnection };