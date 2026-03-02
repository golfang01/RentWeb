import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { bookingService } from '../../api/bookingService';

const statusLabel = {
  pending: { text: 'รอดำเนินการ', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { text: 'อนุมัติแล้ว', cls: 'bg-blue-100 text-blue-700' },
  picked_up: { text: 'รับของแล้ว', cls: 'bg-purple-100 text-purple-700' },
  completed: { text: 'เสร็จสิ้น', cls: 'bg-green-100 text-green-700' },
  cancelled: { text: 'ยกเลิก', cls: 'bg-gray-100 text-gray-500' },
  rejected: { text: 'ปฏิเสธ', cls: 'bg-red-100 text-red-600' },
};

const ShopBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');

  // ✅ async function แยกออกมา
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingService.getShopBookings();
      setBookings(res.data.data || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ useEffect เรียกแค่ function
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleAction = async (action, id) => {
    setActionLoading(id + action);
    try {
      if (action === 'approve') await bookingService.approveBooking(id);
      if (action === 'reject') await bookingService.rejectBooking(id);
      if (action === 'pickup') await bookingService.markAsPickedUp(id);
      if (action === 'return') await bookingService.markAsReturned(id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(null);
    }
  };

  const filters = ['all', 'pending', 'confirmed', 'picked_up', 'completed'];
  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🗂️ จัดการการจอง</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                filter === f ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
              }`}>
              {f === 'all' ? 'ทั้งหมด' : statusLabel[f]?.text}
              {f !== 'all' && (
                <span className="ml-1.5 text-xs">({bookings.filter((b) => b.status === f).length})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">ไม่มีการจอง</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => {
              const s = statusLabel[b.status] || { text: b.status, cls: 'bg-gray-100 text-gray-500' };
              const isLoading = (action) => actionLoading === b.booking_id + action;

              return (
                <div key={b.booking_id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{b.product_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.text}</span>
                      </div>
                      <p className="text-sm text-gray-500">👤 {b.renter_name} · {b.renter_email}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                        <span>📅 {new Date(b.start_date).toLocaleDateString('th-TH')} – {new Date(b.end_date).toLocaleDateString('th-TH')}</span>
                        <span className="font-bold text-orange-500">฿{Number(b.total_price).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction('approve', b.booking_id)} disabled={!!actionLoading}
                            className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                            {isLoading('approve') ? '...' : '✅ อนุมัติ'}
                          </button>
                          <button onClick={() => handleAction('reject', b.booking_id)} disabled={!!actionLoading}
                            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                            {isLoading('reject') ? '...' : '❌ ปฏิเสธ'}
                          </button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => handleAction('pickup', b.booking_id)} disabled={!!actionLoading}
                          className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          {isLoading('pickup') ? '...' : '📦 รับของแล้ว'}
                        </button>
                      )}
                      {b.status === 'picked_up' && (
                        <button onClick={() => handleAction('return', b.booking_id)} disabled={!!actionLoading}
                          className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          {isLoading('return') ? '...' : '🔙 คืนของแล้ว'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopBookingsPage;