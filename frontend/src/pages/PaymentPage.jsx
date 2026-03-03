import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { paymentService } from '../api/paymentService';
import { bookingService } from '../api/bookingService';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking]   = useState(null);
  const [payment, setPayment]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // ⭐ Map Payment (ไม่เปลี่ยนมาก)
  const mapPayment = (pdata) => {
    if (pdata && pdata.payment_status) {
      return { ...pdata, status: pdata.payment_status };
    }
    return pdata;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bRes, pRes] = await Promise.allSettled([
          bookingService.getBookingById(bookingId),
          paymentService.getPaymentByBooking(bookingId, { noCache: true }),
        ]);
        if (bRes.status === 'fulfilled') setBooking(bRes.value.data.data);

        if (pRes.status === 'fulfilled') {
          const pdata = pRes.value.data.data;
          let payObj = Array.isArray(pdata) ? pdata[0] : pdata;
          payObj = mapPayment(payObj);
          setPayment(payObj);
          // ✅ Debug log ที่ควรมี
          console.log("payment object in render:", payObj);
          console.log("slip_image_url:", payObj?.slip_image_url);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, [bookingId]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return setError('กรุณาเลือกรูปสลิป');
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('slip', file);
      await paymentService.uploadSlip(bookingId, formData);
      setSuccess('อัปโหลดสลิปสำเร็จ! รอร้านค้าตรวจสอบ');
      const pRes = await paymentService.getPaymentByBooking(bookingId, { noCache: true });
      let pdata = pRes.data.data;
      let payObj = Array.isArray(pdata) ? pdata[0] : pdata;
      payObj = mapPayment(payObj);
      setPayment(payObj);
      setFile(null); setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || 'อัปโหลดไม่สำเร็จ');
    } finally { setUploading(false); }
  };

  const statusConfig = {
    pending:               { text: 'รอชำระเงิน',    bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
    pending_verification:  { text: 'รอตรวจสอบสลิป', bg: '#FFEFC7', color: '#B45309', border: '#FBBF24' },
    uploaded:              { text: 'รออนุมัติสลิป', bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
    verified:              { text: 'ชำระแล้ว',      bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
    rejected:              { text: 'สลิปถูกปฏิเสธ', bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: '40px auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 24 }}>
          <div style={{ height: 20, background: '#F3F4F6', borderRadius: 6, marginBottom: 16 }} />
          <div style={{ height: 120, background: '#F3F4F6', borderRadius: 12, marginBottom: 16 }} />
          <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: '60%' }} />
        </div>
      </div>
    </div>
  );

  const s = payment ? (statusConfig[payment.status] || statusConfig.pending) : statusConfig.pending;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 40px' }}>
        {/* Back */}
        <button onClick={() => navigate('/bookings')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
          ← กลับไปการจอง
        </button>

        {/* Booking Summary */}
        {booking && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: '#FFF7ED', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #FED7AA' }}>📦</div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{booking.product_name}</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>🏪 {booking.shop_name}</p>
              </div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>วันรับ</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{new Date(booking.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>วันคืน</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{new Date(booking.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>ยอดชำระ</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#F97316', margin: 0 }}>��{Number(booking.total_price || 0).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>สถานะการจอง</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, textTransform: 'capitalize' }}>{booking.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {payment && (
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>
              {payment.status === 'verified' ? '✅' :
               payment.status === 'rejected' ? '❌' : '⏳'}
            </span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: s.color, margin: 0 }}>{s.text}</p>
              {payment.status === 'rejected' && <p style={{ fontSize: 12, color: '#DC2626', margin: '2px 0 0' }}>กรุณาอัปโหลดสลิปใหม่</p>}
            </div>
          </div>
        )}

        {/* Upload Section */}
        {(
          !payment ||
          payment.status === 'pending' ||
          payment.status === 'pending_verification' ||
          payment.status === 'rejected'
        ) && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>💸 อัปโหลดสลิปการชำระเงิน</h3>
            {error   && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>⚠️ {error}</div>}
            {success && <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>✅ {success}</div>}
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{ border: '2px dashed #FED7AA', borderRadius: 16, padding: '32px 16px', textAlign: 'center', background: preview ? 'transparent' : '#FFF7ED', transition: 'all 0.15s', overflow: 'hidden' }}>
                {preview ? (
                  <img src={preview} alt="slip preview" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, objectFit: 'contain' }} />
                ) : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#F97316', margin: '0 0 4px' }}>คลิกเพื่อเลือกรูปสลิป</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>รองรับ JPG, PNG ขนาดไม่เกิน 5MB</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            {preview && (
              <button onClick={() => { setFile(null); setPreview(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9CA3AF', marginTop: 8, padding: 0 }}>
                ✕ เลือกใหม่
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ width: '100%', marginTop: 16, background: !file || uploading ? '#FED7AA' : '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: !file || uploading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
              {uploading ? 'กำลังอัปโหลด...' : '📤 ส่งสลิป'}
            </button>
          </div>
        )}

        {/* ✅ ใส่ "แสดงสลิป" ไว้ด้านนอก FE */}
        {payment?.slip_image_url && (
  <div style={{ margin: '18px 0', textAlign: 'center' }}>
    <img
      src={`http://localhost:3000/uploads/${payment.slip_image_url}`}
      alt="slip"
      style={{ maxWidth: 320, maxHeight: 320, borderRadius: 12 }}
    />
    <div style={{ fontSize: 13, color: '#6B7280' }}>สลิปการชำระเงิน</div>
  </div>
)}
        {/* Already verified */}
        {payment?.status === 'verified' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>ชำระเงินสำเร็จแล้ว!</p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>รอร้านค้าอนุมัติการจองของคุณ</p>
            <button onClick={() => navigate('/bookings')} style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              ดูการจองของฉัน
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;