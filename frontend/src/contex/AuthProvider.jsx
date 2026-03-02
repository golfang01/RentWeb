import { useState } from 'react';
import { AuthContext } from './AuthContext';

const getInitialUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const getInitialToken = () => localStorage.getItem('token') || null;

// ✅ ไฟล์นี้ export component อย่างเดียว → fast refresh ทำงานได้
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [token, setToken] = useState(getInitialToken);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;