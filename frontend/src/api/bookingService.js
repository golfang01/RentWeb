import api from './axios';

export const bookingService = {
  // User
  getUserBookings: () => api.get('/bookings/my'),
  createBooking:   (data) => api.post('/bookings', data),
  cancelBooking:   (id) => api.post(`/bookings/${id}/cancel`),
  getBookingById:  (id) => api.get(`/bookings/${id}`),

  // Shop Owner
  getShopBookings: () => api.get('/bookings/shop/all'),
  approveBooking:  (id) => api.post(`/bookings/${id}/approve`),
  rejectBooking:   (id) => api.post(`/bookings/${id}/reject`),
  markAsPickedUp:  (id) => api.post(`/bookings/${id}/picked-up`),
  markAsReturned:  (id) => api.post(`/bookings/${id}/returned`),
};