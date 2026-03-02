import api from './axios';

export const categoryService = {
  getAllCategories: () => api.get('/categories'),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  getProductsByCategory: (id) => api.get(`/categories/${id}/products`),
};