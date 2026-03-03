import api from './axios';

export const paymentService = {
  getPaymentByBooking: (bookingId, options = {}) =>
    api.get(`/payments/${bookingId}`, {
      params: { t: Date.now(), ...(options.params || {}) },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...(options.headers || {}),
      },
    }),
  uploadSlip: (bookingId, data) =>
    api.post(`/payments/${bookingId}/slip`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};