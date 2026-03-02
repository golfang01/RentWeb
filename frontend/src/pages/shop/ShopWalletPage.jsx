import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { walletService } from '../../api/walletService';

const tabs = [
  { key: 'overview',     label: '💰 ภาพรวม' },
  { key: 'transactions', label: '📊 ธุรกรรม' },
  { key: 'withdraw',     label: '🏧 ถอนเงิน' },
];

const txTypeLabel = {
  booking_payment: { text: 'รับชำระ',  color: '#15803D', bg: '#DCFCE7', sign: '+' },
  withdrawal:      { text: 'ถอนเงิน',  color: '#DC2626', bg: '#FEE2E2', sign: '-' },
  refund:          { text: 'คืนเงิน',  color: '#D97706', bg: '#FEF3C7', sign: '-' },
};

const withdrawStatusLabel = {
  pending:  { text: 'รอดำเนินการ', bg: '#FEF9C3', color: '#854D0E' },
  approved: { text: 'อนุมัติแล้ว', bg: '#DCFCE7', color: '#15803D' },
  rejected: { text: 'ถูกปฏิเสธ',  bg: '#FEE2E2', color: '#DC2626' },
};

const ShopWalletPage = () => {
  const [activeTab, setActiveTab]       = useState('overview');
  const [balance, setBalance]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bank_name: '', bank_account_number: '' });
  const [withdrawing, setWithdrawing]   = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, txRes, wdRes] = await Promise.allSettled([
        walletService.getBalance(),
        walletService.getTransactions(),
        walletService.getWithdrawals(),
      ]);
      if (balRes.status === 'fulfilled') setBalance(balRes.value.data.data);
      if (txRes.status === 'fulfilled')  setTransactions(txRes.value.data.data || []);
      if (wdRes.status === 'fulfilled')  setWithdrawals(wdRes.value.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleWithdraw = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!withdrawForm.amount || Number(withdrawForm.amount) <= 0) return setError('กรุณาระบุจำนวนเงินที่ถูกต้อง');
    if (Number(withdrawForm.amount) > Number(balance?.wallet_balance || 0)) return setError('ยอดเงินไม่เพียงพอ');
    setWithdrawing(true);
    try {
      await walletService.requestWithdrawal(withdrawForm);
      setSuccess('ส่งคำขอถอนเงินสำเร็จ! รอ Admin อนุมัติ');
      setWithdrawForm({ amount: '', bank_name: '', bank_account_number: '' });
      fetchAll();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setWithdrawing(false); }
  };

  const balanceNum = Number(balance?.wallet_balance || 0);
  const S = {
    input: { width: '100%', border: '1.5px solid #E5E7EB', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)', padding: '32px 16px 60px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>ยอดเงินในกระเป๋า</p>
          {loading ? (
            <div style={{ height: 56, background: 'rgba(255,255,255,0.2)', borderRadius: 12, width: 200, margin: '0 auto' }} />
          ) : (
            <p style={{ fontSize: 48, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-1px' }}>
              ฿{balanceNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          )}
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>ยอดเงินที่สามารถถอนได้</p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '-32px auto 0', padding: '0 16px 40px', position: 'relative' }}>
        {/* Tabs */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 6, display: 'flex', gap: 4, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setError(''); setSuccess(''); }} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: activeTab === t.key ? '#F97316' : 'transparent', color: activeTab === t.key ? '#fff' : '#6B7280', boxShadow: activeTab === t.key ? '0 2px 8px rgba(249,115,22,0.3)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 600 }}>รายรับรวม</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#15803D', margin: 0 }}>
                  ฿{transactions.filter(t => t.type === 'booking_payment').reduce((s, t) => s + Number(t.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 600 }}>ถอนเงินไปแล้ว</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#DC2626', margin: 0 }}>
                  ฿{withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Pending Withdrawals */}
            {withdrawals.filter(w => w.status === 'pending').length > 0 && (
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 14, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#854D0E', margin: '0 0 8px' }}>⏳ คำขอถอนเงินที่รอดำเนินการ</p>
                {withdrawals.filter(w => w.status === 'pending').map(w => (
                  <div key={w.withdrawal_id || w.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#854D0E' }}>
                    <span>{w.bank_name} {w.bank_account_number}</span>
                    <span style={{ fontWeight: 700 }}>฿{Number(w.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Transactions */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>ธุรกรรมล่าสุด</h3>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>ยังไม่มีธุรกรรม</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {transactions.slice(0, 5).map((t, i) => {
                    const type = txTypeLabel[t.type] || { text: t.type, color: '#374151', bg: '#F3F4F6', sign: '' };
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 10 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{t.description || type.text}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{new Date(t.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: type.color }}>
                          {type.sign}฿{Number(t.amount).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TRANSACTIONS ===== */}
        {activeTab === 'transactions' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>ประวัติธุรกรรมทั้งหมด</h3>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(5)].map((_, i) => <div key={i} style={{ height: 52, background: '#F9FAFB', borderRadius: 10 }} />)}
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <p style={{ color: '#9CA3AF', fontSize: 14 }}>ยังไม่มีธุรกรรม</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transactions.map((t, i) => {
                  const type = txTypeLabel[t.type] || { text: t.type, color: '#374151', bg: '#F3F4F6', sign: '' };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F9FAFB', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: type.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                          {t.type === 'booking_payment' ? '💳' : t.type === 'withdrawal' ? '🏧' : '↩️'}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{t.description || type.text}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                            {new Date(t.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: type.color }}>
                        {type.sign}฿{Number(t.amount).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== WITHDRAW ===== */}
        {activeTab === 'withdraw' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Balance display */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>ยอดที่ถอนได้</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#F97316' }}>฿{balanceNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Withdraw Form */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>🏧 ถอนเงิน</h3>
              {error   && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>⚠️ {error}</div>}
              {success && <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>✅ {success}</div>}

              <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={S.label}>จำนวนเงิน (฿) *</label>
                  <input style={S.input} type="number" min="1" max={balanceNum} step="0.01"
                    value={withdrawForm.amount}
                    onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                    placeholder="ระบุจำนวนเงิน" required />
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>สูงสุด ฿{balanceNum.toLocaleString()}</p>
                </div>
                <div>
                  <label style={S.label}>ธนาคาร *</label>
                  <select style={{ ...S.input, appearance: 'none' }} value={withdrawForm.bank_name} onChange={e => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })} required>
                    <option value="">-- เลือกธนาคาร --</option>
                    {['ธนาคารกรุงเทพ', 'ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงไทย', 'ธนาคารกรุงศรีอยุธยา', 'ธนาคารทหารไทยธนชาต', 'ธนาคารออมสิน', 'ธนาคารอาคารสงเคราะห์'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label}>เลขบัญชีธนาคาร *</label>
                  <input style={S.input} type="text"
                    value={withdrawForm.bank_account_number}
                    onChange={e => setWithdrawForm({ ...withdrawForm, bank_account_number: e.target.value })}
                    placeholder="xxx-x-xxxxx-x" required />
                </div>

                <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>⚠️ คำขอถอนเงินจะถูก Admin ตรวจสอบภายใน 1-3 วันทำการ</p>
                </div>

                <button type="submit" disabled={withdrawing || balanceNum <= 0} style={{ background: withdrawing || balanceNum <= 0 ? '#FED7AA' : '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: withdrawing || balanceNum <= 0 ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                  {withdrawing ? 'กำลังส่งคำขอ...' : '🏧 ส่งคำขอถอนเงิน'}
                </button>
              </form>
            </div>

            {/* Withdrawal History */}
            {withdrawals.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>ประวัติการถอน</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {withdrawals.map((w, i) => {
                    const ws = withdrawStatusLabel[w.status] || withdrawStatusLabel.pending;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 10 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{w.bank_name} · {w.bank_account_number}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{new Date(w.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#DC2626', margin: '0 0 2px' }}>-฿{Number(w.amount).toLocaleString()}</p>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: ws.bg, color: ws.color }}>{ws.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopWalletPage;