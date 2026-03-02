// บรรทัด 1 — เพิ่ม useNavigate
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // ← เพิ่มบรรทัดนี้
import Navbar from '../components/Navbar';
import { bookingService } from '../api/bookingService';

const statusConfig = {
  pending:   { text: 'รอดำเนินการ', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  confirmed: { text: 'อนุมัติแล้ว', bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
  picked_up: { text: 'รับของแล้ว',  bg: '#F3E8FF', color: '#6B21A8', border: '#C084FC' },
  completed: { text: 'เสร็จสิ้น',   bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  cancelled: { text: 'ยกเลิกแล้ว', bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
  rejected:  { text: 'ถูกปฏิเสธ',  bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
};

const tabs = [
  { key: 'all',       label: 'ทั้งหมด' },
  { key: 'pending',   label: 'รอดำเนินการ' },
  { key: 'confirmed', label: 'อนุมัติแล้ว' },
  { key: 'completed', label: 'เสร็จสิ้น' },
  { key: 'cancelled', label: 'ยกเลิก' },
];

const BookingsPage = () => {
    const navigate = useNavigate();
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [activeTab, setActiveTab]   = useState('all');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingService.getUserBookings();
      setBookings(res.data.data || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id) => {
    if (!confirm('ต้องการยกเลิกการจองนี้?')) return;
    setCancelling(id);
    try {
      await bookingService.cancelBooking(id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'ไม่สามารถยกเลิกได้');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const countByStatus = (key) =>
    key === 'all' ? bookings.length : bookings.filter(b => b.status === key).length;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, background: '#FFF7ED',
              borderRadius: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22, border: '1px solid #FED7AA'
            }}>📋</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>การจองของฉัน</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{bookings.length} รายการทั้งหมด</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 1 }}>
            {tabs.map(t => {
              const count = countByStatus(t.key);
              const active = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 999,
                  fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? '#F97316' : '#F3F4F6',
                  color: active ? '#fff' : '#6B7280',
                  boxShadow: active ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
                }}>
                  {t.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 11, padding: '1px 7px', borderRadius: 999, fontWeight: 700,
                      background: active ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                      color: active ? '#fff' : '#6B7280',
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 16, padding: 20,
                border: '1px solid #F3F4F6', animation: 'pulse 1.5s infinite'
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 56, height: 56, background: '#F3F4F6', borderRadius: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: '50%', marginBottom: 8 }} />
                    <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: '35%', marginBottom: 8 }} />
                    <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: '65%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6'
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>ไม่มีการจอง</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
              {activeTab === 'all' ? 'คุณยังไม่เคยจองสินค้า' : `ไม่มีการจองในสถานะนี้`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((b) => {
              const s = statusConfig[b.status] || statusConfig.cancelled;
              const days = Math.max(1, Math.ceil((new Date(b.end_date) - new Date(b.start_date)) / 86400000));
              const fmtDate = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

              return (
                <div key={b.booking_id} style={{
                  background: '#fff', borderRadius: 16,
                  border: '1px solid #F3F4F6',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s',
                }}>
                  {/* Status bar top */}
                  <div style={{ height: 3, background: s.border }} />

                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {/* Icon */}
                      <div style={{
                        width: 52, height: 52, background: '#FFF7ED',
                        borderRadius: 12, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 24, flexShrink: 0,
                        border: '1px solid #FED7AA'
                      }}>📦</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                          <h3 style={{
                            fontSize: 15, fontWeight: 700, color: '#111827',
                            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>{b.product_name || 'สินค้า'}</h3>
                          <span style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600,
                            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                            flexShrink: 0, whiteSpace: 'nowrap'
                          }}>{s.text}</span>
                        </div>

                        {/* Shop */}
                        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 10px' }}>
                          🏪 {b.shop_name || '-'}
                        </p>

                        {/* Date & Price */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>
                            📅 {fmtDate(b.start_date)} – {fmtDate(b.end_date)}
                            <span style={{ color: '#9CA3AF' }}> · {days} วัน</span>
                          </span>
                          <span style={{ fontSize: 17, fontWeight: 800, color: '#F97316' }}>
                            ฿{Number(b.total_price || 0).toLocaleString()}
                          </span>
                        </div>

                        {b.deposit_held > 0 && (
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>
                            มัดจำ ฿{Number(b.deposit_held).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cancel button */}
                    {b.status === 'pending' && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F9FAFB', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleCancel(b.booking_id)}
                          disabled={cancelling === b.booking_id}
                          style={{
                            fontSize: 13, color: '#EF4444', background: '#FFF',
                            border: '1px solid #FCA5A5', padding: '7px 16px',
                            borderRadius: 10, cursor: 'pointer', fontWeight: 600,
                            opacity: cancelling === b.booking_id ? 0.5 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          {cancelling === b.booking_id ? 'กำลังยกเลิก...' : '✕ ยกเลิกการจอง'}
                        </button>
                      </div>
                    )}
                  </div>
                  {/* เพิ่มปุ่ม ชำระเงิน เมื่อ confirmed */}
{b.status === 'confirmed' && (
  <button
    onClick={() => navigate(`/payment/${b.booking_id}`)}
    style={{
      fontSize: 13, color: '#fff', background: '#F97316',
      border: 'none', padding: '7px 16px',
      borderRadius: 10, cursor: 'pointer', fontWeight: 600,
    }}
  >
    💸 ชำระเงิน
  </button>
)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;