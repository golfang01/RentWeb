import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './contex/AuthProvider';
import useAuth from './contex/useAuth';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BookingsPage from './pages/BookingsPage';
import CreateShopPage from './pages/shop/CreateShopPage';
import ShopProductsPage from './pages/shop/ShopProductsPage';
import ShopBookingsPage from './pages/shop/ShopBookingsPage';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* ✅ บังคับเต็มจอ */}
        <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#FFF8F3' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/bookings" element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
            <Route path="/shop/create" element={<PrivateRoute><CreateShopPage /></PrivateRoute>} />
            <Route path="/shop/products" element={<PrivateRoute><ShopProductsPage /></PrivateRoute>} />
            <Route path="/shop/bookings" element={<PrivateRoute><ShopBookingsPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;