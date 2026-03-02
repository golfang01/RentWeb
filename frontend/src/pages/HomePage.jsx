import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { publicProductService } from '../api/publicProductService';
import { categoryService } from '../api/categoryService';
import { bookingService } from '../api/bookingService';
import useAuth from '../contex/useAuth';

// ===== Booking Modal =====
const BookingModal = ({ product, onClose, onSuccess }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(today);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
  const total = days * Number(product.daily_rate || 0);

  const handleBook = async () => {
    if (new Date(endDate) < new Date(startDate)) return setError('วันคืนต้องหลังวันรับ');
    setLoading(true); setError('');
    try {
      await bookingService.createBooking({
        product_id: product.product_id,
        start_date: startDate,
        end_date:   endDate,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'ไม่สามารถจองได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 28,
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{product.product_name}</h3>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>🏪 {product.shop_name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>✕</button>
        </div>

        <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
            💰 <strong>฿{Number(product.daily_rate).toLocaleString()}</strong>/วัน
            &nbsp;·&nbsp; มัดจำ <strong>฿{Number(product.deposit_amount).toLocaleString()}</strong>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>วันรับสินค้า</label>
            <input type="date" value={startDate} min={today}
              onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>วันคืนสินค้า</label>
            <input type="date" value={endDate} min={startDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
            <span>ระยะเวลา</span><span>{days} วัน</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#111827' }}>
            <span>รวมทั้งหมด</span>
            <span style={{ color: '#F97316' }}>฿{total.toLocaleString()}</span>
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>⚠️ {error}</p>}

        <button onClick={handleBook} disabled={loading} style={{
          width: '100%', background: loading ? '#FED7AA' : '#F97316',
          color: '#fff', border: 'none', borderRadius: 12,
          padding: '13px 0', fontSize: 15, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
        }}>
          {loading ? 'กำลังจอง...' : '📅 ยืนยันการจอง'}
        </button>
      </div>
    </div>
  );
};

// ===== Product Card =====
const ProductCard = ({ product, onBook }) => {
  const img = product.images?.[0]?.image_url;
  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
    >
      <div style={{ height: 160, background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {img
          ? <img src={img} alt={product.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 48 }}>📦</span>
        }
      </div>
      <div style={{ padding: '14px 14px 16px' }}>
        <p style={{ fontSize: 11, color: '#F97316', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {product.category_name || 'สินค้า'}
        </p>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.product_name}
        </h3>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px' }}>🏪 {product.shop_name || '-'}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#F97316' }}>
              ฿{Number(product.daily_rate).toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>/วัน</span>
          </div>
          <button onClick={() => onBook(product)} style={{
            background: '#F97316', color: '#fff', border: 'none',
            borderRadius: 8, padding: '7px 14px', fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
          }}>จอง</button>
        </div>
      </div>
    </div>
  );
};

// ===== Main Page =====
const HomePage = () => {
 const { user: _user } = useAuth(); // ขึ้นต้นด้วย _ เพื่อบอก eslint ว่าตั้งใจไม่ใช้
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [bookingProduct, setBookingProduct] = useState(null);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search)      params.search      = search;
      if (selectedCat) params.category_id = selectedCat;
      const res = await publicProductService.getAllProducts(params);
      setProducts(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCat, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    categoryService.getAllCategories()
      .then(res => setCategories(res.data.data || res.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCatFilter = (catId) => {
    setSelectedCat(catId);
    setPage(1);
  };

  const handleBookSuccess = () => {
    setBookingProduct(null);
    setBookSuccess(true);
    setTimeout(() => setBookSuccess(false), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)',
        padding: '48px 16px 56px',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
            เช่าสิ่งที่คุณต้องการ
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', margin: '0 0 28px' }}>
            กล้อง โดรน อุปกรณ์ผจญภัย และอีกมากมาย
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 480, margin: '0 auto' }}>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ค้นหาสินค้า..."
              style={{
                flex: 1, border: 'none', borderRadius: 12, padding: '13px 18px',
                fontSize: 14, outline: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              }}
            />
            <button type="submit" style={{
              background: '#fff', color: '#F97316', border: 'none', borderRadius: 12,
              padding: '13px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            }}>ค้นหา</button>
          </form>
        </div>
      </div>

      {/* Success Toast */}
      {bookSuccess && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#10B981', color: '#fff', borderRadius: 12,
          padding: '12px 24px', fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(16,185,129,0.4)', zIndex: 9999,
        }}>
          ✅ จองสำเร็จแล้ว!
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px' }}>
        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
          <button onClick={() => handleCatFilter('')} style={{
            padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            background: selectedCat === '' ? '#F97316' : '#fff',
            color: selectedCat === '' ? '#fff' : '#6B7280',
            boxShadow: selectedCat === '' ? '0 2px 8px rgba(249,115,22,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
          }}>ทั้งหมด</button>
          {categories.map(c => (
            <button key={c.category_id} onClick={() => handleCatFilter(c.category_id)} style={{
              padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: selectedCat == c.category_id ? '#F97316' : '#fff',
              color: selectedCat == c.category_id ? '#fff' : '#6B7280',
              boxShadow: selectedCat == c.category_id ? '0 2px 8px rgba(249,115,22,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
            }}>{c.name}</button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                <div style={{ height: 160, background: '#F3F4F6' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, marginBottom: 8, width: '60%' }} />
                  <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>ไม่พบสินค้า</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {products.map(p => (
                <ProductCard key={p.product_id} product={p} onBook={setBookingProduct} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                  padding: '8px 16px', borderRadius: 10, border: '1px solid #E5E7EB',
                  background: page === 1 ? '#F9FAFB' : '#fff', color: page === 1 ? '#D1D5DB' : '#374151',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13,
                }}>← ก่อน</button>
                <span style={{ padding: '8px 16px', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                  {page} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                  padding: '8px 16px', borderRadius: 10, border: '1px solid #E5E7EB',
                  background: page === totalPages ? '#F9FAFB' : '#fff', color: page === totalPages ? '#D1D5DB' : '#374151',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13,
                }}>ถัดไป →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {bookingProduct && (
        <BookingModal
          product={bookingProduct}
          onClose={() => setBookingProduct(null)}
          onSuccess={handleBookSuccess}
        />
      )}
    </div>
  );
};

export default HomePage;