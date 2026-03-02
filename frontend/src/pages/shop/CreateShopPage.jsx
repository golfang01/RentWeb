import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { shopService } from '../../api/shopService';
import useAuth from '../../contex/useAuth';

const autofillFix = { WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' };
const S = {
  input: { width: '100%', border: '1.5px solid #E5E7EB', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', ...autofillFix },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
};

const CreateShopPage = () => {
  const navigate = useNavigate();
  const { user, login, token } = useAuth();
  const [form, setForm] = useState({ shop_name: '', description: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await shopService.createShop(form);

      // ✅ Backend ส่ง user ที่มี role ใหม่กลับมา
      if (res.data.user) {
        login(res.data.user, token);
      }
      navigate('/shop/dashboard');

    } catch (err) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาด';
      const existingShop = err.response?.data?.existing_shop;

      // ✅ มีร้านอยู่แล้วใน DB แต่ role ยังเป็น user → แก้ role แล้ว redirect
      if (err.response?.status === 400 && existingShop) {
        login({ ...user, role: 'shop_owner' }, token);
        navigate('/shop/dashboard');
        return;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🏪</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>เปิดร้านของคุณ</h1>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>กรอกข้อมูลร้านเพื่อเริ่มให้เช่า</p>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={S.label}>ชื่อร้าน *</label>
              <input style={S.input} type="text" value={form.shop_name}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                placeholder="ชื่อร้านของคุณ" required />
            </div>
            <div>
              <label style={S.label}>รายละเอียดร้าน</label>
              <textarea style={{ ...S.input, resize: 'none', lineHeight: 1.6 }} rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="บอกเล่าเกี่ยวกับร้านของคุณ..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={S.label}>เบอร์โทรร้าน</label>
                <input style={S.input} type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0812345678" />
              </div>
              <div>
                <label style={S.label}>ที่อยู่ร้าน</label>
                <input style={S.input} value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="กรุงเทพฯ" />
              </div>
            </div>

            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
                📋 หลังสร้างร้านแล้ว คุณจะได้รับสิทธิ์ <strong>เจ้าของร้าน</strong> สามารถเพิ่มสินค้าและรับการจองได้ทันที
              </p>
            </div>

            <button type="submit" disabled={loading} style={{ background: loading ? '#FED7AA' : '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)', marginTop: 4 }}>
              {loading ? 'กำลังสร้างร้าน...' : '🏪 สร้างร้านเลย'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateShopPage;