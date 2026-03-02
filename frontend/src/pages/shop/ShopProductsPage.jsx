import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { productService } from '../../api/productService';

const autofillFix = { WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' };
const inputClass = "w-full border border-gray-300 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-400";
const emptyForm = { product_name: '', description: '', daily_rate: '', deposit_amount: '', category_id: '' };

const ShopProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ✅ async function แยกออกมา
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getMyProducts();
      setProducts(res.data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ useEffect เรียกแค่ function
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreate = () => { setEditProduct(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ product_name: p.product_name, description: p.description || '', daily_rate: p.daily_rate, deposit_amount: p.deposit_amount || '', category_id: p.category_id || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editProduct) {
        await productService.updateProduct(editProduct.product_id, form);
      } else {
        await productService.createProduct(form);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบสินค้านี้?')) return;
    try {
      await productService.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'ลบไม่ได้');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📦 จัดการสินค้า</h1>
          <button onClick={openCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-md shadow-orange-200">
            + เพิ่มสินค้า
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 mb-4">ยังไม่มีสินค้า</p>
            <button onClick={openCreate} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
              + เพิ่มสินค้าแรก
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.product_id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-1">{p.product_name}</h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{p.description || '-'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-orange-500 font-bold">฿{Number(p.daily_rate).toLocaleString()}/วัน</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)}
                      className="text-sm text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1 rounded-lg transition-colors">
                      แก้ไข
                    </button>
                    <button onClick={() => handleDelete(p.product_id)}
                      className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors">
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editProduct ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}
            </h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">⚠️ {error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อสินค้า *</label>
                <input type="text" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  placeholder="ชื่อสินค้า" required className={inputClass} style={autofillFix} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">รายละเอียด</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดสินค้า..." rows={3} className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ราคา/วัน (฿) *</label>
                  <input type="number" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
                    placeholder="500" required min="1" className={inputClass} style={autofillFix} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">มัดจำ (฿)</label>
                  <input type="number" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                    placeholder="0" min="0" className={inputClass} style={autofillFix} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl py-3 text-sm font-semibold transition-colors">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopProductsPage;