import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { shopService } from '../../api/shopService';
import { bookingService } from '../../api/bookingService';
import { productService } from '../../api/productService';

const S = {
  input:  { width: '100%', border: '1.5px solid #E5E7EB', background: '#fff', borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' },
  label:  { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
};

const StatCard = ({ icon, label, value, sub, color = '#F97316' }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ width: 40, height: 40, background: `${color}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
    </div>
    <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 600 }}>{label}</p>
    <p style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 2px' }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{sub}</p>}
  </div>
);

const ShopDashboardPage = () => {
  const navigate = useNavigate();
  const [shop, setShop]           = useState(null);
  const [bookings, setBookings]   = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editMode, setEditMode]   = useState(false);
  const [form, setForm]           = useState({ shop_name: '', description: '', phone: '', address: '' });
  const [saving, setSaving]       = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError]         = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [shopRes, bookRes, prodRes] = await Promise.allSettled([
        shopService.getMyShop(),
        bookingService.getShopBookings(),
        productService.getMyProducts(),
      ]);
      if (shopRes.status === 'fulfilled') {
        const s = shopRes.value.data.data;
        setShop(s);
        setForm({ shop_name: s.shop_name || '', description: s.description || '', phone: s.phone || '', address: s.address || '' });
      }
      if (bookRes.status === 'fulfilled') setBookings(bookRes.value.data.data || []);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveShop = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await shopService.updateMyShop(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setEditMode(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  // Stats คำนวณ
  const totalRevenue  = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + Number(b.total_price || 0), 0);
  const pendingCount  = bookings.filter(b => b.status === 'pending').length;
  const activeCount   = products.filter(p => p.status === 'active').length;
  const recentBookings = [...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const statusConfig = {
    pending:   { text: 'รอดำเนินการ', bg: '#FEF9C3', color: '#854D0E' },
    confirmed: { text: 'อนุมัติแล้ว', bg: '#DBEAFE', color: '#1E40AF' },
    picked_up: { text: 'รับของแล้ว',  bg: '#F3E8FF', color: '#6B21A8' },
    completed: { text: 'เสร็จสิ้น',   bg: '#DCFCE7', color: '#15803D' },
    cancelled: { text: 'ยกเลิก',      bg: '#F3F4F6', color: '#6B7280' },
    rejected:  { text: 'ปฏิเสธ',     bg: '#FEE2E2', color: '#DC2626' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)', padding: '28px 16px 60px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {loading ? (
            <div style={{ height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 10, width: 200 }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>🏪 {shop?.shop_name || 'ร้านของฉัน'}</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{shop?.address || 'ยังไม่ได้ระบุที่อยู่'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditMode(true)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✏️ แก้ไขร้าน</button>
                <button onClick={() => navigate('/shop/wallet')} style={{ background: '#fff', color: '#F97316', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>💰 Wallet</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '-36px auto 0', padding: '0 16px 40px', position: 'relative' }}>
        {/* Save success */}
        {saveSuccess && (
          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            ✅ บันทึกข้อมูลร้านสำเร็จ!
          </div>
        )}

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon="💰" label="รายได้รวม"    value={`฿${totalRevenue.toLocaleString()}`} sub="จากออเดอร์เสร็จสิ้น" color="#F97316" />
          <StatCard icon="📋" label="รอดำเนินการ"  value={pendingCount}  sub="การจองใหม่" color="#EAB308" />
          <StatCard icon="📦" label="สินค้าทั้งหมด" value={products.length} sub={`พร้อมเช่า ${activeCount} ชิ้น`} color="#8B5CF6" />
          <StatCard icon="📊" label="การจองทั้งหมด" value={bookings.length} sub="ตลอดการใช้งาน" color="#3B82F6" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Recent Bookings */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>📋 การจองล่าสุด</h2>
              <button onClick={() => navigate('/shop/bookings')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#F97316', fontWeight: 600, cursor: 'pointer' }}>ดูทั้งหมด →</button>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(3)].map((_, i) => <div key={i} style={{ height: 48, background: '#F9FAFB', borderRadius: 10 }} />)}
              </div>
            ) : recentBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>ยังไม่มีการจอง</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentBookings.map(b => {
                  const s = statusConfig[b.status] || statusConfig.cancelled;
                  return (
                    <div key={b.booking_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.product_name || 'สินค้า'}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>฿{Number(b.total_price || 0).toLocaleString()}</p>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, fontWeight: 600, background: s.bg, color: s.color, flexShrink: 0, marginLeft: 8 }}>{s.text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Products summary */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>📦 สินค้าของฉัน</h2>
              <button onClick={() => navigate('/shop/products')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#F97316', fontWeight: 600, cursor: 'pointer' }}>จัดการ →</button>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(3)].map((_, i) => <div key={i} style={{ height: 48, background: '#F9FAFB', borderRadius: 10 }} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 12px' }}>ยังไม่มีสินค้า</p>
                <button onClick={() => navigate('/shop/products')} style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ เพิ่มสินค้า</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.slice(0, 5).map(p => (
                  <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.product_name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>฿{Number(p.daily_rate).toLocaleString()}</span>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: p.status === 'active' ? '#DCFCE7' : '#F3F4F6', color: p.status === 'active' ? '#15803D' : '#6B7280', fontWeight: 600 }}>{p.status === 'active' ? 'เปิด' : 'ปิด'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Shop Modal */}
      {editMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={() => setEditMode(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>✏️ แก้ไขข้อมูลร้าน</h2>
              <button onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
            </div>
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>}
            <form onSubmit={handleSaveShop} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>ชื่อร้าน *</label>
                <input style={S.input} value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} placeholder="ชื่อร้าน" required />
              </div>
              <div>
                <label style={S.label}>รายละเอียดร้าน</label>
                <textarea style={{ ...S.input, resize: 'none', lineHeight: 1.6 }} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="รายละเอียดร้าน..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>เบอร์โทร</label>
                  <input style={S.input} type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0812345678" />
                </div>
                <div>
                  <label style={S.label}>ที่อยู่</label>
                  <input style={S.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="กรุงเทพฯ" />
                </div>
              </div>
              <button type="submit" disabled={saving} style={{ background: saving ? '#FED7AA' : '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboardPage;