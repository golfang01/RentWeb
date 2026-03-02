import api from './axios';

export const paymentService = {
  getPaymentByBooking: (bookingId)       => api.get(`/payments/${bookingId}`),
  uploadSlip:          (bookingId, data) => api.post(`/payments/${bookingId}/slip`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};