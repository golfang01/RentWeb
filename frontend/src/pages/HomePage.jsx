import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { categoryService } from '../api/categoryService';
import { bookingService } from '../api/bookingService';

// ===== Mock Products =====
const MOCK_HOT = [
  { product_id: 9001, product_name: 'Sony A7 IV Body', description: 'Full-frame mirrorless camera', daily_rate: 1200, deposit_amount: 5000, availability_status: 'available', images: [], shop_name: 'Camera Pro Shop', rating_score: 4.9 },
  { product_id: 9002, product_name: 'DJI Mini 3 Pro', description: 'โดรนขนาดเล็ก บินง่าย ภาพสวย', daily_rate: 900, deposit_amount: 4000, availability_status: 'available', images: [], shop_name: 'Sky Rental', rating_score: 4.8 },
  { product_id: 9003, product_name: 'GoPro Hero 11', description: 'Action camera ความละเอียดสูง', daily_rate: 450, deposit_amount: 2000, availability_status: 'available', images: [], shop_name: 'Adventure Gear', rating_score: 4.7 },
  { product_id: 9004, product_name: 'Canon EOS R5', description: 'Canon R5 พร้อม lens 24-70mm', daily_rate: 1800, deposit_amount: 8000, availability_status: 'available', images: [], shop_name: 'Lens World', rating_score: 5.0 },
];
const MOCK_RECOMMENDED = [
  { product_id: 9005, product_name: 'Coleman Tent 4 คน', description: 'เต็นท์แคมป์ปิ้ง กันน้ำ กันลม', daily_rate: 350, deposit_amount: 1500, availability_status: 'available', images: [], shop_name: 'Camp Gear', rating_score: 4.6 },
  { product_id: 9006, product_name: 'MacBook Pro M3', description: 'Laptop สำหรับงาน Creative', daily_rate: 800, deposit_amount: 10000, availability_status: 'available', images: [], shop_name: 'Tech Rental', rating_score: 4.8 },
  { product_id: 9007, product_name: 'Guitar Fender Strat', description: 'กีตาร์ไฟฟ้า Fender Classic', daily_rate: 300, deposit_amount: 3000, availability_status: 'available', images: [], shop_name: 'Music Store', rating_score: 4.5 },
  { product_id: 9008, product_name: 'Projector Epson 4K', description: 'โปรเจคเตอร์ 4K ความสว่างสูง', daily_rate: 600, deposit_amount: 5000, availability_status: 'rented', images: [], shop_name: 'AV Rental', rating_score: 4.7 },
];

const isMockProduct = (id) => Number(id) >= 9001 && Number(id) <= 9999;
const categoryIcons = ['📷', '🎒', '🏕️', '🎸', '🏄', '🚴', '🎮', '🔧', '👗', '🏋️'];

const getProductEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('sony') || n.includes('canon') || n.includes('nikon') || n.includes('camera')) return '📷';
  if (n.includes('gopro') || n.includes('action')) return '🎥';
  if (n.includes('drone') || n.includes('dji')) return '🚁';
  if (n.includes('tent') || n.includes('เต็นท์') || n.includes('coleman')) return '🏕️';
  if (n.includes('macbook') || n.includes('laptop')) return '💻';
  if (n.includes('lens') || n.includes('เลนส์')) return '🔭';
  if (n.includes('guitar') || n.includes('กีตาร์')) return '🎸';
  if (n.includes('projector') || n.includes('โปรเจค')) return '📽️';
  return '📦';
};

// ===== Booking Modal =====
const BookingModal = ({ product, onClose, onSuccess }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
  const rental = days * Number(product.daily_rate);
  const deposit = Number(product.deposit_amount || 0);
  const isMock = isMockProduct(product.product_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(endDate) < new Date(startDate)) return setError('วันคืนต้องหลังวันรับ');

    if (isMock) { onSuccess(true); return; }

    setLoading(true);
    setError('');
    try {
      await bookingService.createBooking({
        product_id: Number(product.product_id),
        start_date: startDate,
        end_date: endDate,
      });
      onSuccess(false);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: '700', fontSize: '18px', color: '#fff', margin: 0 }}>🛒 ยืนยันการเช่า</h2>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', color: '#fff', cursor: 'pointer', fontSize: '16px',
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '14px', backgroundColor: '#fff7ed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0,
          }}>
            {getProductEmoji(product.product_name)}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>{product.product_name}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>🏪 {product.shop_name || 'ร้านค้า'}</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#f97316', marginTop: '4px' }}>
              ฿{Number(product.daily_rate).toLocaleString()}
              <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400' }}>/วัน</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {isMock && (
            <div style={{
              backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e',
              borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px',
            }}>⚠️ สินค้าตัวอย่าง (Demo) — การจองจะไม่ถูกบันทึก</div>
          )}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626',
              borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px',
            }}>⚠️ {error}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: '📅 วันที่รับ', value: startDate, min: today, set: setStartDate },
              { label: '📅 วันที่คืน', value: endDate, min: startDate, set: setEndDate },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{f.label}</label>
                <input type="date" value={f.value} min={f.min}
                  onChange={(e) => f.set(e.target.value)} required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid #e5e7eb', fontSize: '14px',
                    color: '#111827', outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#f9fafb', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
            {[
              { label: 'จำนวนวัน', value: `${days} วัน` },
              { label: `ค่าเช่า (฿${Number(product.daily_rate).toLocaleString()} × ${days})`, value: `฿${rental.toLocaleString()}` },
              { label: 'มัดจำ (คืนหลังส่งของคืน)', value: `฿${deposit.toLocaleString()}` },
            ].map((r, i, arr) => (
              <div key={r.label} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                borderBottom: i < arr.length - 1 ? '1px dashed #e5e7eb' : 'none',
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{r.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{r.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e5e7eb', marginTop: '10px', paddingTop: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>รวมทั้งหมด</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#f97316' }}>฿{(rental + deposit).toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '13px', borderRadius: '12px',
              border: '1.5px solid #e5e7eb', backgroundColor: '#fff',
              color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            }}>ยกเลิก</button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '13px', borderRadius: '12px', border: 'none',
              backgroundColor: loading ? '#fed7aa' : '#f97316',
              color: '#fff', fontWeight: '700', fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
            }}>
              {loading ? 'กำลังส่งคำขอ...' : isMock ? '✅ ทดลองจอง (Demo)' : '✅ ยืนยันการเช่า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== Toast =====
const SuccessToast = ({ isMock, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '28px',
      backgroundColor: '#111827', color: '#fff', borderRadius: '16px',
      padding: '16px 22px', boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', gap: '14px', zIndex: 2000,
    }}>
      <span style={{ fontSize: '24px' }}>✅</span>
      <div>
        <div style={{ fontWeight: '700', fontSize: '15px' }}>
          {isMock ? 'ทดลองจองสำเร็จ! (Demo)' : 'ส่งคำขอเช่าสำเร็จ!'}
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
          {isMock ? 'เพิ่มสินค้า��ริงในร้านเพื่อเช่าได้จริง' : 'ดูสถานะได้ที่ "การจองของฉัน"'}
        </div>
      </div>
    </div>
  );
};

// ===== Product Card =====
const ProductCard = ({ product, onRent, showRank }) => {
  const [hovered, setHovered] = useState(false);
  const isAvailable = product.availability_status === 'available' || product.availability_status === 'active';
  const imgUrl = product.images?.[0]?.image_url || null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#fff',
        border: '1.5px solid ' + (hovered && isAvailable ? '#f97316' : '#e5e7eb'),
        borderRadius: '18px', overflow: 'hidden',
        cursor: isAvailable ? 'pointer' : 'default', transition: 'all 0.2s',
        boxShadow: hovered && isAvailable ? '0 10px 28px rgba(249,115,22,0.15)' : '0 1px 6px rgba(0,0,0,0.05)',
        transform: hovered && isAvailable ? 'translateY(-4px)' : 'translateY(0)',
        opacity: isAvailable ? 1 : 0.65,
      }}
    >
      <div style={{
        height: '155px', backgroundColor: '#fff7ed',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '50px', position: 'relative',
      }}>
        {imgUrl
          ? <img src={imgUrl} alt={product.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>{getProductEmoji(product.product_name)}</span>
        }
        {showRank && (
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            backgroundColor: '#f97316', color: '#fff', fontSize: '11px', fontWeight: '800',
            padding: '3px 10px', borderRadius: '999px',
          }}>🔥 #{showRank}</div>
        )}
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          backgroundColor: isAvailable ? '#22c55e' : '#94a3b8',
          color: '#fff', fontSize: '11px', fontWeight: '700',
          padding: '3px 10px', borderRadius: '999px',
        }}>{isAvailable ? '✓ ว่าง' : 'ไม่ว่าง'}</div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{
          fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '3px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{product.product_name}</h3>
        <p style={{
          fontSize: '12px', color: '#6b7280', marginBottom: '3px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{product.description || 'ไม่มีรายละเอียด'}</p>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '10px' }}>
          🏪 {product.shop_name || 'ร้านค้า'}
          {product.rating_score ? ` · ⭐ ${Number(product.rating_score).toFixed(1)}` : ''}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#f97316' }}>
              ฿{Number(product.daily_rate).toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>/วัน</span>
          </div>
          <button
            onClick={() => isAvailable && onRent(product)}
            disabled={!isAvailable}
            style={{
              backgroundColor: isAvailable ? '#f97316' : '#e5e7eb',
              color: isAvailable ? '#fff' : '#9ca3af',
              border: 'none', borderRadius: '9px',
              padding: '7px 14px', fontSize: '13px', fontWeight: '700',
              cursor: isAvailable ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => { if (isAvailable) e.currentTarget.style.backgroundColor = '#ea580c'; }}
            onMouseLeave={(e) => { if (isAvailable) e.currentTarget.style.backgroundColor = '#f97316'; }}
          >
            {isAvailable ? 'เช่าเลย' : 'ไม่ว่าง'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ emoji, title, subtitle }) => (
  <div style={{ marginBottom: '18px' }}>
    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>{emoji} {title}</h2>
    {subtitle && <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>{subtitle}</p>}
  </div>
);

const SkeletonCard = () => (
  <div style={{ backgroundColor: '#f3f4f6', borderRadius: '18px', height: '260px' }} />
);

const ProductGrid = ({ products, onRent, showRank }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '16px' }}>
    {products.map((p, i) => (
      <ProductCard key={p.product_id} product={p} onRent={onRent} showRank={showRank ? i + 1 : null} />
    ))}
  </div>
);

// ===== Main HomePage =====
const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingProduct, setBookingProduct] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  // ✅ ประกาศ state ครบ
  const [lastBookingIsMock, setLastBookingIsMock] = useState(false);

  const loadDefaultProducts = useCallback(async (cats) => {
    setLoadingDefault(true);
    try {
      const promises = cats.slice(0, 2).map((c) =>
        categoryService.getProductsByCategory(c.category_id).catch(() => null)
      );
      const results = await Promise.all(promises);
      const p1 = results[0]?.data?.data || [];
      const p2 = results[1]?.data?.data || [];
      setHotProducts(p1.length > 0 ? p1.slice(0, 4) : MOCK_HOT);
      setRecommendedProducts(p2.length > 0 ? p2.slice(0, 4) : MOCK_RECOMMENDED);
    } catch {
      setHotProducts(MOCK_HOT);
      setRecommendedProducts(MOCK_RECOMMENDED);
    } finally {
      setLoadingDefault(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await categoryService.getAllCategories();
      const cats = res.data.data || [];
      setCategories(cats);
      if (cats.length > 0) loadDefaultProducts(cats);
      else {
        setHotProducts(MOCK_HOT);
        setRecommendedProducts(MOCK_RECOMMENDED);
        setLoadingDefault(false);
      }
    } catch {
      setCategories([]);
      setHotProducts(MOCK_HOT);
      setRecommendedProducts(MOCK_RECOMMENDED);
      setLoadingDefault(false);
    } finally {
      setLoadingCats(false);
    }
  }, [loadDefaultProducts]);

  const fetchProducts = useCallback(async (categoryId) => {
    setLoadingProducts(true);
    try {
      const res = await categoryService.getProductsByCategory(categoryId);
      const data = res.data.data || [];
      setProducts(data.length > 0 ? data : MOCK_HOT);
    } catch {
      setProducts(MOCK_HOT);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    if (selectedCategory) fetchProducts(selectedCategory);
    else setProducts([]);
  }, [selectedCategory, fetchProducts]);

  const filteredProducts = products.filter((p) =>
    p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ รับ isMock parameter จาก BookingModal
  const handleBookingSuccess = (mockFlag = false) => {
    setLastBookingIsMock(mockFlag);
    setBookingProduct(null);
    setShowSuccess(true);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#FFF8F3' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        padding: '52px 24px 60px', textAlign: 'center',
      }}>
        <h1 style={{ color: '#fff', fontSize: '34px', fontWeight: '800', marginBottom: '8px' }}>
          เช่าสิ่งที่คุณต้องการ 🚀
        </h1>
        <p style={{ color: '#fed7aa', fontSize: '16px', marginBottom: '30px' }}>
          กล้อง โดรน อุปกรณ์แคมป์ปิ้ง และอีกมากมาย — เช่าง่าย คืนส��ดวก
        </p>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาสินค้าที่ต้องการ..."
              style={{
                width: '100%', padding: '14px 16px 14px 44px',
                borderRadius: '12px', border: 'none', fontSize: '15px',
                color: '#111827', backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button style={{
            backgroundColor: '#111827', color: '#fff', border: 'none',
            borderRadius: '12px', padding: '14px 26px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>ค้นหา</button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 24px 60px' }}>

        {/* Categories */}
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '14px' }}>🏷️ หมวดหมู่</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '9px 20px', borderRadius: '12px', cursor: 'pointer',
                border: '1.5px solid ' + (!selectedCategory ? '#f97316' : '#e5e7eb'),
                backgroundColor: !selectedCategory ? '#f97316' : '#fff',
                color: !selectedCategory ? '#fff' : '#374151',
                fontWeight: '600', fontSize: '14px', transition: 'all 0.15s',
              }}
            >ทั้งหมด</button>
            {loadingCats
              ? [...Array(3)].map((_, i) => (
                  <div key={i} style={{ width: '100px', height: '40px', borderRadius: '12px', backgroundColor: '#e5e7eb' }} />
                ))
              : categories.map((cat, i) => (
                  <button
                    key={cat.category_id}
                    onClick={() => setSelectedCategory(cat.category_id)}
                    style={{
                      padding: '9px 20px', borderRadius: '12px', cursor: 'pointer',
                      border: '1.5px solid ' + (selectedCategory === cat.category_id ? '#f97316' : '#e5e7eb'),
                      backgroundColor: selectedCategory === cat.category_id ? '#f97316' : '#fff',
                      color: selectedCategory === cat.category_id ? '#fff' : '#374151',
                      fontWeight: '600', fontSize: '14px', transition: 'all 0.15s',
                    }}
                  >
                    {categoryIcons[i % categoryIcons.length]} {cat.category_name || cat.name}
                  </button>
                ))}
          </div>
        </div>

        {/* Default View */}
        {!selectedCategory ? (
          <>
            <div style={{ marginBottom: '48px' }}>
              <SectionHeader emoji="🔥" title="Hot Deals" subtitle="สินค้ายอดนิยม เช่าเยอะที่สุดในขณะนี้" />
              {loadingDefault
                ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '16px' }}>
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                : <ProductGrid products={hotProducts} onRent={setBookingProduct} showRank />
              }
            </div>

            <div style={{ marginBottom: '48px' }}>
              <SectionHeader emoji="⭐" title="Recommended for You" subtitle="สินค้าแนะนำที่คัดมาเพื่อคุณ" />
              {loadingDefault
                ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '16px' }}>
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                : <ProductGrid products={recommendedProducts} onRent={setBookingProduct} />
              }
            </div>

            {/* CTA */}
            <div style={{
              background: 'linear-gradient(135deg,#111827,#1f2937)',
              borderRadius: '20px', padding: '36px 40px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px',
            }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>🏪 มีของให้เช่า?</h3>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>เปิดร้านและเริ่มสร้างรายได้วันนี้ — ฟรี ไม่มีค่าธรรมเนียม</p>
              </div>
              <a href="/shop/create" style={{
                backgroundColor: '#f97316', color: '#fff', padding: '14px 28px',
                borderRadius: '14px', fontWeight: '700', fontSize: '15px',
                textDecoration: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
              }}>เปิดร้านเลย →</a>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                สินค้า {!loadingProducts && `(${filteredProducts.length} รายการ)`}
              </h2>
              <button onClick={() => setSelectedCategory(null)} style={{
                fontSize: '13px', color: '#6b7280', backgroundColor: 'transparent',
                border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
              }}>← กลับหน้าหลัก</button>
            </div>

            {loadingProducts
              ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '16px' }}>
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              : filteredProducts.length === 0
                ? <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <p style={{ fontSize: '16px', color: '#6b7280' }}>ไม่พบสินค้าในหมวดหมู่นี้</p>
                  </div>
                : <ProductGrid products={filteredProducts} onRent={setBookingProduct} />
            }
          </>
        )}
      </div>

      {bookingProduct && (
        <BookingModal
          product={bookingProduct}
          onClose={() => setBookingProduct(null)}
          onSuccess={handleBookingSuccess}  // ✅ ส่ง isMock กลับมา
        />
      )}
      {showSuccess && (
        <SuccessToast
          isMock={lastBookingIsMock}  // ✅ ใช้ state ที่ประกาศไว้
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};

export default HomePage;