import api from './axios';

export const publicProductService = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id)    => api.get(`/products/${id}`),
};