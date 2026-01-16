const { pool } = require('../config/database');

class User {
  /**
   * Create new user
   */
  static async create(userData) {
    const { email, password_hash, full_name, role = 'user' } = userData;
    
    const query = `
      INSERT INTO Users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, email, full_name, role, kyc_status, created_at
    `;
    
    const values = [email, password_hash, full_name, role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    // ⭐ เปลี่ยนจาก SELECT * เป็นระบุคอลัมน์
    const query = `
      SELECT 
        user_id,
        email,
        password_hash,
        full_name,
        phone_number,
        profile_image,
        role,
        kyc_status,
        created_at
      FROM Users 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(userId) {
    const query = `
      SELECT 
        u. user_id,
        u. email,
        u.full_name,
        u.phone_number,
        u.profile_image,
        u.role,
        u.kyc_status,
        u.created_at,
        s.shop_id,
        s.shop_name,
        s.wallet_balance
      FROM Users u
      LEFT JOIN Shops s ON u. user_id = s.user_id
      WHERE u.user_id = $1
    `;
    const result = await pool. query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Update user profile
   */
  static async update(userId, userData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['full_name', 'phone_number', 'profile_image'];
    
    Object.entries(userData).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const query = `
      UPDATE Users 
      SET ${fields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING user_id, email, full_name, phone_number, profile_image, role, kyc_status
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = User;