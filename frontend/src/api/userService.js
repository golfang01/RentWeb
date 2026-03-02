import api from './axios';

export const userService = {
  getMe:          ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/me/password', data),
};