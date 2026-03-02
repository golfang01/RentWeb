import api from './axios';

export const shopService = {
  // ✅ รับ token เสริมได้ กรณีเรียกหลัง login ทันที
  getMyShop: (token) => api.get('/shops/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }),
  updateMyShop: (data) => api.put('/shops/me', data),
  createShop:   (data) => api.post('/shops', data),
  getAllShops:   ()     => api.get('/shops'),
  getShopById:  (id)   => api.get(`/shops/${id}`),
};