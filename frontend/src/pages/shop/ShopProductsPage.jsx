import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { productService } from '../../api/productService';
import { categoryService } from '../../api/categoryService';

const emptyForm = { product_name: '', description: '', daily_rate: '', deposit_amount: '', category_id: '', status: 'active' };

const S = {
  input: { width: '100%', border: '1.5px solid #E5E7EB', background: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', WebkitBoxShadow: '0 0 0px 1000px white inset', WebkitTextFillColor: '#111827' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
};

const ShopProductsPage = () => {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [deleting, setDeleting]   = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getMyProducts();
      setProducts(res.data.data || []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    categoryService.getAllCategories()
      .then(res => setCategories(res.data.data || res.data || []))
      .catch(() => {});
  }, []);

  const openCreate = () => { setEditProduct(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ product_name: p.product_name, description: p.description || '', daily_rate: p.daily_rate, deposit_amount: p.deposit_amount || '', category_id: p.category_id || '', status: p.status || 'active' });
    setError(''); setShowModal(true);
  };

   const handleSave = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      // ✅ แปลง field name ให้ตรงกับ backend
      const payload = {
        title: form.product_name,
        description: form.description,
        price_per_day: form.daily_rate,
        deposit_amount: form.deposit_amount,
        category_id: form.category_id || null,
        status: form.status,
      };

      if (editProduct) await productService.updateProduct(editProduct.product_id, payload);
      else             await productService.createProduct(payload);
      setShowModal(false); fetchProducts();
    } catch (err) { setError(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบสินค้านี้?')) return;
    setDeleting(id);
    try { await productService.deleteProduct(id); fetchProducts(); }
    catch (err) { alert(err.response?.data?.message || 'ลบไม่ได้'); }
    finally { setDeleting(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: '#FFF7ED', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #FED7AA' }}>📦</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>จัดการสินค้า</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{products.length} รายการ</p>
            </div>
          </div>
          <button onClick={openCreate} style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
            + เพิ่มสินค้า
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #F3F4F6' }}>
                <div style={{ height: 140, background: '#F3F4F6', borderRadius: 12, marginBottom: 12 }} />
                <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: '60%' }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>ยังไม่มีสินค้า</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px' }}>เริ่มเพิ่มสินค้าเพื่อให้ลูกค้าเช่า</p>
            <button onClick={openCreate} style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ เพิ่มสินค้าแรก</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {products.map(p => {
              const img = p.images?.[0]?.image_url;
              return (
                <div key={p.product_id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ height: 140, background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {img ? <img src={img} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 40 }}>📦</span>}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</h3>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, marginLeft: 8, background: p.status === 'active' ? '#DCFCE7' : '#F3F4F6', color: p.status === 'active' ? '#15803D' : '#6B7280', border: `1px solid ${p.status === 'active' ? '#86EFAC' : '#E5E7EB'}`, flexShrink: 0 }}>
                        {p.status === 'active' ? 'พร้อมเช่า' : 'ปิด'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || '-'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#F97316' }}>฿{Number(p.daily_rate).toLocaleString()}</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>/วัน</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>มัดจำ ฿{Number(p.deposit_amount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(p)} style={{ flex: 1, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✏️ แก้ไข</button>
                      <button onClick={() => handleDelete(p.product_id)} disabled={deleting === p.product_id} style={{ flex: 1, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleting === p.product_id ? 0.5 : 1 }}>
                        {deleting === p.product_id ? '...' : '🗑️ ลบ'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{editProduct ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
            </div>
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>ชื่อสินค้า *</label>
                <input style={S.input} value={form.product_name} onChange={e => setForm({...form, product_name: e.target.value})} placeholder="ชื่อสินค้า" required />
              </div>
              <div>
                <label style={S.label}>รายละเอียด</label>
                <textarea style={{ ...S.input, resize: 'none', lineHeight: 1.6 }} rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="รายละเอียดสินค้า..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>ราคา/วัน (฿) *</label>
                  <input style={S.input} type="number" min="0" value={form.daily_rate} onChange={e => setForm({...form, daily_rate: e.target.value})} placeholder="500" required />
                </div>
                <div>
                  <label style={S.label}>มัดจำ (฿)</label>
                  <input style={S.input} type="number" min="0" value={form.deposit_amount} onChange={e => setForm({...form, deposit_amount: e.target.value})} placeholder="2000" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>หมวดหมู่</label>
                  <select style={{ ...S.input, appearance: 'none' }} value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>สถานะ</label>
                  <select style={{ ...S.input, appearance: 'none' }} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="active">พร้อมเช่า</option>
                    <option value="inactive">ปิดชั่วคราว</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} style={{ background: saving ? '#FED7AA' : '#F97316', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)', marginTop: 4 }}>
                {saving ? 'กำลังบันทึก...' : editProduct ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มสินค้า'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopProductsPage;