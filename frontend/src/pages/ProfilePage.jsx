import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import useAuth from '../contex/useAuth';
import { userService } from '../api/userService';

const S = {
  input: { width: '100%', border: '1.5px solid #E5E7EB', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827', transition: 'border-color 0.15s' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
};

const ProfilePage = () => {
  const { user, login, token } = useAuth();
  const [form, setForm]         = useState({ full_name: '', email: '', phone: '' });
  const [pwForm, setPwForm]     = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading]   = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [pwError, setPwError]   = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await userService.updateProfile({ full_name: form.full_name, phone: form.phone });
      login({ ...user, ...res.data.data }, token);
      setSuccess('บันทึกข้อมูลสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPwError('');
    if (pwForm.new_password !== pwForm.confirm_password) return setPwError('รหัสผ่านใหม่ไม่ตรงกัน');
    if (pwForm.new_password.length < 6) return setPwError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
    setPwLoading(true);
    try {
      await userService.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setSuccess('เปลี่ยนรหัสผ่านสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
    } finally { setPwLoading(false); }
  };

  const avatar = user?.full_name?.charAt(0)?.toUpperCase() || 'U';
  const roleTh = user?.role === 'shop_owner' ? 'เจ้าของร้าน' : 'ผู้เช่า';

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)', padding: '32px 16px 64px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 auto 12px', border: '3px solid rgba(255,255,255,0.4)' }}>
            {avatar}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{user?.full_name || 'ผู้ใช้'}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{user?.email} · {roleTh}</p>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '-32px auto 0', padding: '0 16px 40px', position: 'relative' }}>
        {/* Tabs */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 6, display: 'flex', gap: 4, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          {[['profile', '👤 ข้อมูลส่วนตัว'], ['password', '🔒 เปลี่ยนรหัสผ่าน']].map(([key, label]) => (
            <button key={key} onClick={() => { setActiveTab(key); setError(''); setPwError(''); setSuccess(''); }} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: activeTab === key ? '#F97316' : 'transparent', color: activeTab === key ? '#fff' : '#6B7280', boxShadow: activeTab === key ? '0 2px 8px rgba(249,115,22,0.3)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Toast */}
        {success && (
          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            ✅ {success}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.label}>ชื่อ-นามสกุล</label>
                <input style={S.input} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="ชื่อ-นามสกุล" />
              </div>
              <div>
                <label style={S.label}>อีเมล</label>
                <input style={{ ...S.input, background: '#F9FAFB', color: '#9CA3AF' }} value={form.email} disabled />
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>ไม่สามารถเปลี่ยนอีเมลได้</p>
              </div>
              <div>
                <label style={S.label}>เบอร์โทรศัพท์</label>
                <input style={S.input} type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0812345678" />
              </div>

              {/* Info Card */}
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>บทบาท</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{roleTh}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>สถานะ KYC</p>
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999, fontWeight: 600, background: user?.kyc_status === 'verified' ? '#DCFCE7' : '#FEF9C3', color: user?.kyc_status === 'verified' ? '#15803D' : '#854D0E', border: `1px solid ${user?.kyc_status === 'verified' ? '#86EFAC' : '#FDE047'}` }}>
                    {user?.kyc_status === 'verified' ? '✓ ยืนยันแล้ว' : 'รอยืนยัน'}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>สมาชิกตั้งแต่</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ background: loading ? '#FED7AA' : '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                {loading ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {pwError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>⚠️ {pwError}</div>}
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.label}>รหัสผ่านปัจจุบัน</label>
                <input style={S.input} type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} placeholder="••••••••" required />
              </div>
              <div>
                <label style={S.label}>รหัสผ่านใหม่</label>
                <input style={S.input} type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="อย่างน้อย 6 ตัวอักษร" required />
              </div>
              <div>
                <label style={S.label}>ยืนยันรหัสผ่านใหม่</label>
                <input style={{ ...S.input, borderColor: pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password ? '#FCA5A5' : '#E5E7EB' }} type="password" value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={pwLoading} style={{ background: pwLoading ? '#FED7AA' : '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: pwLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                {pwLoading ? 'กำลังเปลี่ยน...' : '🔒 เปลี่ยนรหัสผ่าน'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;