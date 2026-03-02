import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../contex/useAuth';
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

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(form);

      // ✅ Response: { success, message, data: { user, token } }
      const { user, token } = res.data.data;

      if (!token) {
        setError('ไม่ได้รับ Token จาก Server');
        return;
      }

      login(user, token);
      navigate('/');

    } catch (err) {
      setError(err.response?.data?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
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
          <p className="text-orange-100 mb-10 text-sm">เช่าสิ่งที่คุณต้องการ</p>
          <div className="space-y-3">
            {[
              { icon: '💳', text: 'No Deposit Required' },
              { icon: '🛡️', text: 'Insurance Included' },
              { icon: '🏪', text: 'Easy Return via 7-11' },
              { icon: '✨', text: 'Sanitized & Ready' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 bg-white/15 rounded-xl px-4 py-3">
                <span className="text-lg">{item.icon}</span>
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

          <h2 className="text-2xl font-bold text-gray-900 mb-1">ยินดีต้อนรับกลับ 👋</h2>
          <p className="text-gray-500 text-sm mb-8">เข้าสู่ระบบเพื่อใช้งาน Rentio</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">อีเมล</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
                required
                autoComplete="email"
                className="w-full border border-gray-300 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-400"
                style={{ WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full border border-gray-300 bg-white rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-400"
                  style={{ WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 text-sm transition-colors duration-150 shadow-md shadow-orange-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs">หรือ</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="text-orange-500 hover:text-orange-600 font-semibold">
              สมัครสมาชิกฟรี →
            </Link>
          </p>

          <div className="mt-5 p-4 bg-orange-50 border border-orange-100 rounded-xl text-center">
            <p className="text-sm text-gray-600">
              ต้องการเปิดร้านให้เช่า?{' '}
              <Link to="/register" className="text-orange-500 font-semibold hover:text-orange-600">
                Become a Seller →
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;