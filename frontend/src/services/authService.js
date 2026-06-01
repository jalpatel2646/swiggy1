import axiosClient from '../api/axios';

export const authService = {
  login: async (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },

  register: async (name, email, password) => {
    return axiosClient.post('/auth/register', { name, email, password });
  },

  logout: async () => {
    return axiosClient.post('/auth/logout');
  },

  getProfile: async () => {
    return axiosClient.get('/auth/profile');
  }
};

export default authService;
