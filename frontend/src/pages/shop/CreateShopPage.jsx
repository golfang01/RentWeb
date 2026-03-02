import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { shopService } from '../../api/shopService';

const autofillFix = { WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' };
const inputClass = "w-full border border-gray-300 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-400";

const CreateShopPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ shop_name: '', description: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await shopService.createShop(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🏪</div>
            <h1 className="text-2xl font-bold text-gray-900">เปิดร้านของคุณ</h1>
            <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลร้านเพื่อเริ่มให้เช่า</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อร้าน *</label>
              <input type="text" value={form.shop_name}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                placeholder="ชื่อร้านของคุณ" required className={inputClass} style={autofillFix} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">รายละเอียดร้าน</label>
              <textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="บอกเล่าเกี่ยวกับร้านของคุณ..." rows={3}
                className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">เบอร์โทรร้าน</label>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0812345678" className={inputClass} style={autofillFix} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ที่อยู่ร้าน</label>
              <input type="text" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="ที่อยู่สำหรับรับ-คืนสินค้า" className={inputClass} style={autofillFix} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl py-3.5 text-sm transition-colors shadow-md shadow-orange-200 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  กำลังสร้างร้าน...
                </span>
              ) : '🏪 สร้างร้านเลย'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateShopPage;