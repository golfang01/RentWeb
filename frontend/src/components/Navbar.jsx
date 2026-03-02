import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../contex/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const avatarLetter = (user?.full_name || user?.email || 'U')[0].toUpperCase();
  const isShopOwner = user?.role === 'shop_owner';

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Nav links แยกตาม role
  const navLinks = isShopOwner
    ? [
        { to: '/',               label: 'หน้าแรก' },
        { to: '/shop/dashboard', label: 'Dashboard' },
        { to: '/shop/products',  label: 'สินค้า' },
        { to: '/shop/bookings',  label: 'การจอง' },
      ]
    : [
        { to: '/',         label: 'หน้าแรก' },
        { to: '/bookings', label: 'การจองของฉัน' },
      ];

  // Dropdown items แยกตาม role
  const dropdownItems = isShopOwner
    ? [
        { to: '/shop/dashboard', icon: '📊', label: 'Dashboard' },
        { to: '/shop/products',  icon: '📦', label: 'จัดการสินค้า' },
        { to: '/shop/bookings',  icon: '🗂️', label: 'จัดการจอง' },
        { to: '/shop/wallet',    icon: '💰', label: 'Wallet' },
        { to: '/profile',        icon: '👤', label: 'โปรไฟล์' },
      ]
    : [
        { to: '/',         icon: '🏠', label: 'หน้าแรก' },
        { to: '/bookings', icon: '📋', label: 'การจองของฉัน' },
        { to: '/profile',  icon: '👤', label: 'โปรไฟล์' },
      ];

  const linkStyle = (to) => ({
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive(to) ? '600' : '500',
    color: isActive(to) ? '#f97316' : '#4b5563',
    backgroundColor: isActive(to) ? '#fff7ed' : 'transparent',
    padding: '6px 14px',
    borderRadius: '8px',
    transition: 'all 0.15s',
    borderBottom: isActive(to) ? '2px solid #f97316' : '2px solid transparent',
    whiteSpace: 'nowrap',
  });

  return (
    <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f3f4f6', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', width: '100%' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* ===== Left: Logo + Links ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link to="/" style={{ textDecoration: 'none', marginRight: '16px' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#f97316', letterSpacing: '-0.5px' }}>Rentio</span>
          </Link>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={linkStyle(to)}
              onMouseEnter={(e) => { if (!isActive(to)) { e.currentTarget.style.color = '#f97316'; e.currentTarget.style.backgroundColor = '#fff7ed'; } }}
              onMouseLeave={(e) => { if (!isActive(to)) { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.backgroundColor = 'transparent'; } }}
            >{label}</Link>
          ))}
        </div>

        {/* ===== Right ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Shop Owner: Wallet shortcut | User: เปิดร้าน */}
          {isShopOwner ? (
            <Link to="/shop/wallet" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: '600', color: '#f97316', backgroundColor: '#fff7ed', padding: '8px 16px', borderRadius: '10px', border: '1px solid #fed7aa', whiteSpace: 'nowrap' }}>
              💰 Wallet
            </Link>
          ) : (
            <Link to="/shop/create" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: '600', color: '#ffffff', backgroundColor: '#f97316', padding: '8px 16px', borderRadius: '10px', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
            >🏪 เปิดร้าน</Link>
          )}

          {/* User Dropdown */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: showUserMenu ? '#fff7ed' : '#f9fafb', border: '1.5px solid ' + (showUserMenu ? '#fed7aa' : '#e5e7eb'), borderRadius: '12px', padding: '6px 12px 6px 6px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: isShopOwner ? '#8B5CF6' : '#f97316', color: '#fff', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarLetter}
              </div>
              <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap' }}>
                  {(user?.full_name || user?.email || '').split(' ')[0]}
                </div>
                <div style={{ fontSize: '11px', color: isShopOwner ? '#8B5CF6' : '#9ca3af', fontWeight: 600 }}>
                  {isShopOwner ? '🏪 เจ้าของร้าน' : 'ผู้เช่า'}
                </div>
              </div>
              <svg style={{ width: '14px', height: '14px', color: '#9ca3af', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '210px', overflow: 'hidden', zIndex: 100 }}>
                {/* User Info Header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', background: isShopOwner ? 'linear-gradient(135deg,#F3E8FF,#EDE9FE)' : '#fafafa' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{user?.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{user?.email}</div>
                  <div style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: isShopOwner ? '#EDE9FE' : '#FFF7ED', color: isShopOwner ? '#6B21A8' : '#92400E', fontWeight: 700 }}>
                    {isShopOwner ? '🏪 เจ้าของร้าน' : '👤 ผู้เช่า'}
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding: '6px' }}>
                  {dropdownItems.map(({ to, icon, label }) => (
                    <Link key={to} to={to} onClick={() => setShowUserMenu(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', color: isActive(to) ? '#f97316' : '#374151', backgroundColor: isActive(to) ? '#fff7ed' : 'transparent', fontWeight: isActive(to) ? '600' : '400', transition: 'background-color 0.1s' }}
                      onMouseEnter={(e) => { if (!isActive(to)) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={(e) => { if (!isActive(to)) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span>{icon}</span><span>{label}</span>
                    </Link>
                  ))}
                </div>

                {/* Logout */}
                <div style={{ padding: '6px', borderTop: '1px solid #f3f4f6' }}>
                  <button onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ef4444', backgroundColor: 'transparent', transition: 'background-color 0.1s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>🚪</span><span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;