import api from './axios';

export const walletService = {
  getBalance:      ()     => api.get('/wallet'),
  getTransactions: ()     => api.get('/wallet/transactions'),
  getWithdrawals:  ()     => api.get('/wallet/withdrawals'),
  requestWithdrawal: (data) => api.post('/wallet/withdraw', data),
};