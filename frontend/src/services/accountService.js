import api from './api';

export const accountService = {
  async getAccounts() {
    const response = await api.get('/accounts');
    return response.data;
  },

  async createAccount(accountData) {
    const response = await api.post('/accounts', accountData);
    return response.data;
  },

  async updateAccount(id, accountData) {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response.data;
  },

  async deleteAccount(id) {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  }
};

export default accountService;
