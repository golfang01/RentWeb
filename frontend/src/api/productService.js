import api from './axios';

export const productService = {
  getMyProducts: () => api.get('/shops/products'),
  createProduct: (data) => api.post('/shops/products', data),
  updateProduct: (id, data) => api.put(`/shops/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/shops/products/${id}`),
};