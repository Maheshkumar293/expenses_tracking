import api from './api';

export const authService = {
  async login(identifier, password) {
    const response = await api.post('/auth/login', { identifier, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async register(username, email, password, name) {
    const response = await api.post('/auth/register', { username, email, password, name });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout network errors
    } finally {
      localStorage.removeItem('token');
    }
  },

  async getMe() {
    const token = localStorage.getItem('token');
    if (!token) {
      return { user: null };
    }
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        return { user: null };
      }
      throw err;
    }
  },

  async updateProfile(name, email) {
    const response = await api.put('/auth/profile', { name, email });
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }
};

export default authService;
