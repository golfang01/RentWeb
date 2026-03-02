import api from './axios';

export const shopService = {
  getMyShop: () => api.get('/shops/me'),
  createShop: (data) => api.post('/shops', data),
  updateMyShop: (data) => api.put('/shops/me', data),
  getAllShops: () => api.get('/shops'),
};