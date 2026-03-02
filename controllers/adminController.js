const { pool } = require('../config/database');

class AdminController {
  // GET /api/admin/users
  async getAllUsers(req, res) {
    try {
      const result = await pool.query(
        'SELECT user_id, email, full_name, role, kyc_status, created_at FROM Users ORDER BY created_at DESC'
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // PUT /api/admin/users/:id/role
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'role ต้องเป็น user หรือ admin' });
      }

      const result = await pool.query(
        'UPDATE Users SET role = $1 WHERE user_id = $2 RETURNING user_id, email, role',
        [role, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบ User' });
      }

      res.json({ success: true, message: 'อัพเดต Role สำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/admin/users/:id
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM Users WHERE user_id = $1', [id]);
      res.json({ success: true, message: 'ลบ User สำเร็จ' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/admin/shops
  async getAllShops(req, res) {
    try {
      const result = await pool.query(
        `SELECT s.*, u.email, u.full_name 
         FROM Shops s JOIN Users u ON s.user_id = u.user_id
         ORDER BY s.created_at DESC`
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/admin/shops/:id
  async deleteShop(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM Shops WHERE shop_id = $1', [id]);
      res.json({ success: true, message: 'ลบร้านค้าสำเร็จ' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/admin/categories
  async createCategory(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ Category' });
      }

      const result = await pool.query(
        'INSERT INTO Categories (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || null]
      );

      res.status(201).json({ success: true, message: 'สร้าง Category สำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // PUT /api/admin/categories/:id
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const result = await pool.query(
        'UPDATE Categories SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE category_id = $3 RETURNING *',
        [name, description, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบ Category' });
      }

      res.json({ success: true, message: 'อัพเดต Category สำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/admin/categories/:id
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM Categories WHERE category_id = $1', [id]);
      res.json({ success: true, message: 'ลบ Category สำเร็จ' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/admin/withdrawals
  async getAllWithdrawals(req, res) {
    try {
      const { status } = req.query;
      let query = `
        SELECT wr.*, s.shop_name 
        FROM WithdrawalRequests wr
        JOIN Shops s ON wr.shop_id = s.shop_id
      `;
      const params = [];

      if (status) {
        query += ' WHERE wr.status = $1';
        params.push(status);
      }

      query += ' ORDER BY wr.created_at DESC';

      const result = await pool.query(query, params);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/admin/withdrawals/:id/approve
  async approveWithdrawal(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE WithdrawalRequests 
         SET status = 'approved', processed_at = NOW()
         WHERE withdrawal_id = $1 AND status = 'pending'
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบคำขอถอนเงิน หรือสถานะไม่ใช่ pending' });
      }

      res.json({ success: true, message: 'อนุมัติการถอนเงินสำเร็จ', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/admin/withdrawals/:id/reject
  async rejectWithdrawal(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      await pool.query('BEGIN');
      try {
        const withdrawResult = await pool.query(
          `UPDATE WithdrawalRequests 
           SET status = 'rejected', reject_reason = $1, processed_at = NOW()
           WHERE withdrawal_id = $2 AND status = 'pending'
           RETURNING *`,
          [reason || 'ไม่ผ่านการอนุมัติ', id]
        );

        if (withdrawResult.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ success: false, message: 'ไม่พบคำขอถอนเงิน หรือสถานะไม่ใช่ pending' });
        }

        // คืนเงินกลับเข้า Wallet
        const withdrawal = withdrawResult.rows[0];
        await pool.query(
          'UPDATE Shops SET wallet_balance = wallet_balance + $1 WHERE shop_id = $2',
          [withdrawal.amount, withdrawal.shop_id]
        );

        await pool.query('COMMIT');

        res.json({ success: true, message: 'ปฏิเสธการถอนเงินและคืนเงินเข้า Wallet แล้ว', data: withdrawal });
      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AdminController();