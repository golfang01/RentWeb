import { useNavigate } from 'react-router-dom';
import useAuth from '../contex/useAuth';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h2>🏠 Dashboard</h2>
      <p>ยินดีต้อนรับ, <strong>{user?.full_name || user?.email}</strong>!</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={() => navigate('/products')}>📦 สินค้า</button>
        <button onClick={() => navigate('/bookings')}>📋 การจอง</button>
        <button onClick={handleLogout} style={{ marginLeft: 'auto', color: 'red' }}>
          🚪 ออกจากระบบ
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;