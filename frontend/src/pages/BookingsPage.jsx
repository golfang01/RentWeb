import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { bookingService } from '../api/bookingService';

const statusLabel = {
  pending: { text: 'รอดำเนินการ', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { text: 'อนุมัติแล้ว', cls: 'bg-blue-100 text-blue-700' },
  picked_up: { text: 'รับของแล้ว', cls: 'bg-purple-100 text-purple-700' },
  completed: { text: 'เสร็จสิ้น', cls: 'bg-green-100 text-green-700' },
  cancelled: { text: 'ยกเลิกแล้ว', cls: 'bg-gray-100 text-gray-500' },
  rejected: { text: 'ถูกปฏิเสธ', cls: 'bg-red-100 text-red-600' },
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  // ✅ แยกเป็น async function
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingService.getUserBookings();
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

  const handleCancel = async (id) => {
    if (!confirm('ต้องการยกเลิกการจองนี้?')) return;
    setCancelling(id);
    try {
      await bookingService.cancelBooking(id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'ไม่สามารถยกเลิกได้');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 การจองของฉัน</h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">ยังไม่มีการจอง</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const s = statusLabel[b.status] || { text: b.status, cls: 'bg-gray-100 text-gray-500' };
              return (
                <div key={b.booking_id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{b.product_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.text}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">🏪 {b.shop_name}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>📅 {new Date(b.start_date).toLocaleDateString('th-TH')} – {new Date(b.end_date).toLocaleDateString('th-TH')}</span>
                        <span className="font-semibold text-orange-500">฿{Number(b.total_price).toLocaleString()}</span>
                      </div>
                    </div>
                    {b.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(b.booking_id)}
                        disabled={cancelling === b.booking_id}
                        className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        {cancelling === b.booking_id ? '...' : 'ยกเลิก'}
                      </button>
                    )}
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

export default BookingsPage;