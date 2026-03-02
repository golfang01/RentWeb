import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../api/authService';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const autofillFix = { WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' };
const inputClass = "w-full border border-gray-300 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-400 transition-all";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    confirmPassword: '', phone: '', role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) return setError('รหัสผ่านไม่ตรงกัน');
    if (form.password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

    setLoading(true);
    try {
      await authService.register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });
      setSuccess('สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden">

      {/* Left Panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-orange-500 flex-col items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-orange-400/30 rounded-full" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-orange-600/20 rounded-full" />
        <div className="relative z-10 w-full text-white">
          <h1 className="text-4xl font-bold mb-1">Rentio</h1>
          <p className="text-orange-100 text-sm mb-10">เริ่มต้นเช่าหรือให้เช่าวันนี้</p>
          <div className="space-y-3">
            {[
              { step: '1', text: 'สมัครสมาชิกฟรี' },
              { step: '2', text: 'เลือกสินค้าที่ต้องการ' },
              { step: '3', text: 'จองและรับของได้เลย' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 bg-white/15 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-white text-orange-500 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <span className="font-medium text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-[#FFF8F3] flex items-center justify-center px-6 overflow-y-auto">
        <div className="w-full max-w-sm py-10">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-3xl font-bold text-orange-500">Rentio</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">สร้างบัญชีใหม่ ✨</h2>
          <p className="text-gray-500 text-sm mb-6">ฟรี! ไม่มีค่าธรรมเนียมแอบแฝง</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'user', icon: '🛍️', label: 'ผู้เช่า', desc: 'ต้องการเช่าสินค้า' },
              { value: 'shop_owner', icon: '🏪', label: 'เจ้าของร้าน', desc: 'ต้องการให้เช่า' },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm({ ...form, role: r.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all bg-white ${
                  form.role === r.value
                    ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="text-2xl mb-1">{r.icon}</div>
                <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
                <div className="text-gray-500 text-xs mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>

          {/* Alerts */}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อ-นามสกุล</label>
              <input type="text" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="ชื่อ นามสกุล" required autoComplete="name"
                className={inputClass} style={autofillFix} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">อีเมล</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com" required autoComplete="email"
                className={inputClass} style={autofillFix} />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                เบอร์โทรศัพท์ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0812345678" autoComplete="tel"
                className={inputClass} style={autofillFix} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="อย่างน้อย 6 ตัวอักษร" required autoComplete="new-password"
                  className={`${inputClass} pr-12`} style={autofillFix}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ยืนยันรหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง" required autoComplete="new-password"
                  className={`${inputClass} pr-12`} style={autofillFix}
                />
                {/* Password match indicator */}
                {form.confirmPassword && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {form.password === form.confirmPassword ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 text-sm transition-colors duration-150 shadow-md shadow-orange-200 mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  กำลังสมัครสมาชิก...
                </span>
              ) : 'สมัครสมาชิก'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs">หรือ</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            มีบัญชีแล้ว?{' '}
            <Link to="/login" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
              เข้าสู่ระบบ →
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;