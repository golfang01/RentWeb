const { pool } = require('../config/database');

class WalletController {
  // GET /api/wallet — ดูยอด Wallet
  async getWalletBalance(req, res) {
    try {
      const shop_id = req.shop?.shop_id;

      const result = await pool.query(
        'SELECT wallet_balance FROM Shops WHERE shop_id = $1',
        [shop_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบร้านค้า' });
      }

      res.json({
        success: true,
        data: {
          shop_id,
          wallet_balance: result.rows[0].wallet_balance,
        },
      });
    } catch (error) {
      console.error('❌ [getWalletBalance] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // GET /api/wallet/transactions — ดูประวัติธุรกรรม
  async getTransactions(req, res) {
    try {
      const shop_id = req.shop?.shop_id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await pool.query(
        `SELECT * FROM WalletTransactions
         WHERE shop_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [shop_id, parseInt(limit), offset]
      );

      res.json({
        success: true,
        data: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      console.error('❌ [getTransactions] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // POST /api/wallet/withdraw — ขอถอนเงิน
  async requestWithdrawal(req, res) {
    try {
      const shop_id = req.shop?.shop_id;
      const { amount, bank_account_number, bank_name } = req.body;

      if (!amount || !bank_account_number || !bank_name) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุ amount, bank_account_number และ bank_name',
        });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'จำนวนเงินต้องมากกว่า 0' });
      }

      // ตรวจสอบยอดเงิน
      const shopResult = await pool.query(
        'SELECT wallet_balance FROM Shops WHERE shop_id = $1',
        [shop_id]
      );

      const balance = parseFloat(shopResult.rows[0]?.wallet_balance || 0);
      if (parseFloat(amount) > balance) {
        return res.status(400).json({
          success: false,
          message: `ยอดเงินไม่พอ (ยอดปัจจุบัน: ${balance} บาท)`,
        });
      }

      // หัก Wallet และสร้าง Withdrawal Request
      await pool.query('BEGIN');
      try {
        await pool.query(
          'UPDATE Shops SET wallet_balance = wallet_balance - $1 WHERE shop_id = $2',
          [amount, shop_id]
        );

        const withdrawResult = await pool.query(
          `INSERT INTO WithdrawalRequests (shop_id, amount, bank_account_number, bank_name, status)
           VALUES ($1, $2, $3, $4, 'pending')
           RETURNING *`,
          [shop_id, amount, bank_account_number, bank_name]
        );

        await pool.query('COMMIT');

        res.status(201).json({
          success: true,
          message: 'ส่งคำขอถอนเงินสำเร็จ รอ Admin อนุมัติ',
          data: withdrawResult.rows[0],
        });
      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('❌ [requestWithdrawal] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }

  // GET /api/wallet/withdrawals — ดูประวัติการถอนเงิน
  async getWithdrawals(req, res) {
    try {
      const shop_id = req.shop?.shop_id;

      const result = await pool.query(
        `SELECT * FROM WithdrawalRequests
         WHERE shop_id = $1
         ORDER BY created_at DESC`,
        [shop_id]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('❌ [getWithdrawals] Error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
  }
}

module.exports = new WalletController();