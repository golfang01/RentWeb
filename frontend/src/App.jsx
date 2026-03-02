import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './contex/AuthProvider';
import useAuth from './contex/useAuth';

import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import HomePage            from './pages/HomePage';
import BookingsPage        from './pages/BookingsPage';
import ProfilePage         from './pages/ProfilePage';
import PaymentPage         from './pages/PaymentPage';
import CreateShopPage      from './pages/shop/CreateShopPage';
import ShopDashboardPage   from './pages/shop/ShopDashboardPage';
import ShopProductsPage    from './pages/shop/ShopProductsPage';
import ShopBookingsPage    from './pages/shop/ShopBookingsPage';
import ShopWalletPage      from './pages/shop/ShopWalletPage';

// ต้อง login
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

// ต้อง login + ต้องเป็น shop_owner เท่านั้น
const ShopRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'shop_owner') return <Navigate to="/" replace />;
  return children;
};

// shop_owner ที่เข้า /shop/create ให้ redirect ไป dashboard แทน
const CreateShopRoute = () => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'shop_owner') return <Navigate to="/shop/dashboard" replace />;
  return <CreateShopPage />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', width: '100%', background: '#F9FAFB' }}>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* User (ต้อง login) */}
            <Route path="/"                   element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/bookings"           element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
            <Route path="/profile"            element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/payment/:bookingId" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />

            {/* เปิดร้าน: user ปกติมาได้, shop_owner redirect */}
            <Route path="/shop/create" element={<CreateShopRoute />} />

            {/* Shop Owner เท่านั้น */}
            <Route path="/shop/dashboard" element={<ShopRoute><ShopDashboardPage /></ShopRoute>} />
            <Route path="/shop/products"  element={<ShopRoute><ShopProductsPage /></ShopRoute>} />
            <Route path="/shop/bookings"  element={<ShopRoute><ShopBookingsPage /></ShopRoute>} />
            <Route path="/shop/wallet"    element={<ShopRoute><ShopWalletPage /></ShopRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;