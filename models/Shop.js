const pool = require('../config/database');

class Shop {
    static async getShopByUserId(userId) {
        try {
            const result = await pool.query(`
                SELECT 
                    shop_id,
                    shop_name,
                    wallet_balance,
                    created_at
                FROM Shops
                WHERE user_id = $1
            `, [userId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error fetching shop by user ID:', error);
            throw error;
        }
    }
}

module.exports = Shop;