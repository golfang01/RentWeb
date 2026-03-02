import api from './axios';

export const publicProductService = {
  getAllProducts: (params) => api.get('/categories/products/all', { params }),
  getProductsByCategory: (id) => api.get(`/categories/${id}/products`),
};