import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { bookingService } from '../../api/bookingService';
import { paymentService } from '../../api/paymentService';

const statusConfig = {
  pending:   { text: 'รอดำเนินการ',   bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  approved:  { text: 'อนุมัติแล้ว',    bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
  waiting_verification: { text: 'รอตรวจสอบสลิป', bg: '#FFEFC7', color: '#B45309', border: '#FBBF24' },
  picked_up: { text: 'รับของแล้ว',     bg: '#F3E8FF', color: '#6B21A8', border: '#C084FC' },
  completed: { text: 'เสร็จสิ้น',      bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  cancelled: { text: 'ยกเลิก',         bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
  rejected:  { text: 'ถูกปฏิเสธ',      bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
};

const tabList = [
  { key: 'all',      label: 'ทั้งหมด' },
  { key: 'pending',  label: 'รอดำเนินการ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'waiting_verification', label: 'รอตรวจสลิป' },
  { key: 'picked_up',label: 'รับของแล้ว' },
  { key: 'completed',label: 'เสร็จสิ้น' },
  { key: 'cancelled',label: 'ยกเลิก' },
];

const ShopBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showSlip, setShowSlip] = useState(false);
  const [slipUrl, setSlipUrl] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingService.getShopBookings();
      setBookings(res.data.data || []);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ดึงสลิป
  const handleShowSlip = async (booking_id) => {
    try {
      const res = await paymentService.getPaymentByBooking(booking_id);
      let pdata = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      setSlipUrl(pdata?.slip_image_url);
      setShowSlip(true);
      setSelectedBooking(booking_id);
    } catch {
      setSlipUrl('');
      setShowSlip(false);
      alert("ไม่พบสลิปสำหรับรายการนี้");
    }
  };

  // อนุมัติ
  const handleApprove = async (booking_id) => {
  if (!window.confirm('อนุมัติการจองนี้?')) return;
  setActionLoading('approve_' + booking_id);
  try {
    await bookingService.approveBooking(booking_id); // ← ใช้ service ตามนี้
    fetchBookings();
  } catch (err) {
    alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
  } finally {
    setActionLoading(null);
  }
};

  // ยืนยันสลิป
  const handleVerify = async (booking_id) => {
    if (!window.confirm('ยืนยันว่าชำระเงินถูกต้อง?')) return;
    setActionLoading('verify_' + booking_id);
    try {
      await paymentService.verifyPayment(booking_id);
      fetchBookings();
      setShowSlip(false);
    } catch (err) {
      alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(null);
    }
  };

  // ปฏิเสธสลิป
  const handleReject = async (booking_id) => {
    const reason = window.prompt('เห���ุผลในการปฏิเสธ (เช่น สลิปไม่ถูกต้อง):');
    if (reason === null) return;
    setActionLoading('reject_' + booking_id);
    try {
      await paymentService.rejectPayment(booking_id, { reason });
      fetchBookings();
      setShowSlip(false);
    } catch (err) {
      alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => b.status === activeTab);
  const countByTab = (key) => key === 'all' ? bookings.length : bookings.filter(b => b.status === key).length;
  const fmtDate = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, background: '#FFF7ED', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #FED7AA' }}>🗂️</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>จ���ดการการจอง</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{bookings.length} รายการทั้งหมด</p>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 1 }}>
            {tabList.map(t => {
              const count = countByTab(t.key);
              const active = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: active ? '#F97316' : '#F3F4F6', color: active ? '#fff' : '#6B7280',
                  boxShadow: active ? '0 2px 8px rgba(249,115,22,0.3)' : 'none'
                }}>
                  {t.label}
                  {count > 0 && <span style={{
                    fontSize: 11, padding: '1px 7px', borderRadius: 999, fontWeight: 700,
                    background: active ? 'rgba(255,255,255,0.25)' : '#E5E7EB', color: active ? '#fff' : '#6B7280',
                  }}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 52, height: 52, background: '#F3F4F6', borderRadius: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: '50%', marginBottom: 8 }} />
                    <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: '35%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>ไม่มีการจองในหมวดนี้</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(b => {
              const s = statusConfig[b.status] || statusConfig.cancelled;
              const days = Math.max(1, Math.ceil((new Date(b.end_date) - new Date(b.start_date)) / 86400000));
              return (
                <div key={b.booking_id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ height: 3, background: s.border }} />
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 52, height: 52, background: '#FFF7ED', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: '1px solid #FED7AA' }}>📦</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.product_name || 'สินค้า'}</h3>
                          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, flexShrink: 0 }}>{s.text}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 6px' }}>👤 {b.customer_name || b.user_name || 'ลูกค้า'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>📅 {fmtDate(b.start_date)} – {fmtDate(b.end_date)} · {days} วัน</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#F97316' }}>฿{Number(b.total_price || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* ปุ่มอนุมัติ */}
                    {b.status === 'pending' && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleApprove(b.booking_id)}
                          disabled={actionLoading && actionLoading === 'approve_' + b.booking_id}
                          style={{
                            background: '#DBEAFE',
                            color: '#1E40AF',
                            border: '1px solid #93C5FD',
                            borderRadius: 10,
                            padding: '8px 12px',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            opacity: actionLoading === 'approve_' + b.booking_id ? 0.6 : 1
                          }}
                        >
                          {actionLoading === 'approve_' + b.booking_id ? '...' : '✅ อนุมัติ'}
                        </button>
                      </div>
                    )}

                    {/* ปุ่มสลิป */}
                    {b.status === 'waiting_verification' && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleShowSlip(b.booking_id)} style={{ background: '#DBEAFE', color: '#1E40AF', border: '1px solid #93C5FD', borderRadius: 10, padding: '8px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                          👁 ดูสลิป
                        </button>
                        <button onClick={() => handleVerify(b.booking_id)} disabled={actionLoading && actionLoading === 'verify_'+b.booking_id} style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', borderRadius: 10, padding: '8px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: actionLoading === 'verify_'+b.booking_id ? 0.6 : 1 }}>
                          {actionLoading === 'verify_'+b.booking_id ? '...' : '✅ ยืนยันชำระเงิน'}
                        </button>
                        <button onClick={() => handleReject(b.booking_id)} disabled={actionLoading && actionLoading === 'reject_'+b.booking_id} style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: actionLoading === 'reject_'+b.booking_id ? 0.6 : 1 }}>
                          {actionLoading === 'reject_'+b.booking_id ? '...' : '✕ ปฏิเสธสลิป'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slip Modal */}
      {showSlip && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24, maxWidth: 400, minHeight: 200,
            display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative'
          }}>
            <button onClick={() => setShowSlip(false)} style={{ position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer' }}>✕</button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>สลิปการชำระเงิน</h3>
            {slipUrl ? (
  <img
    src={`http://localhost:3000/uploads/${slipUrl}`}
    alt="slip"
    style={{ width: '100%', maxWidth: 330, maxHeight: 350, objectFit: 'contain', marginTop: 12, borderRadius: 12, border: '1px solid #eee' }}
  />
) : (
  <p style={{ marginTop: 30, color: '#B91C1C' }}>ไม่พบสลิป</p>
)}
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button onClick={() => handleVerify(selectedBooking)} disabled={actionLoading === 'verify_' + selectedBooking} style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: actionLoading === 'verify_' + selectedBooking ? 0.6 : 1 }}>
                {actionLoading === 'verify_' + selectedBooking ? '...' : '✅ ยืนยันชำระเงิน'}
              </button>
              <button onClick={() => handleReject(selectedBooking)} disabled={actionLoading === 'reject_' + selectedBooking} style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: actionLoading === 'reject_' + selectedBooking ? 0.6 : 1 }}>
                {actionLoading === 'reject_' + selectedBooking ? '...' : '✕ ปฏิเสธสลิป'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopBookingsPage;