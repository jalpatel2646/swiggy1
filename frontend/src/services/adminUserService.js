import axiosClient from '../api/axios';

const adminUserService = {
  getUsers: async (params) => {
    const response = await axiosClient.get('/admin/users', { params });
    return response.data || response;
  },

  getUserById: async (id) => {
    const response = await axiosClient.get(`/admin/users/${id}`);
    return response.data || response;
  },

  banUser: async (id) => {
    const response = await axiosClient.patch(`/admin/users/${id}/ban`);
    return response.data || response;
  },

  unbanUser: async (id) => {
    const response = await axiosClient.patch(`/admin/users/${id}/unban`);
    return response.data || response;
  },

  updateRole: async (id, role) => {
    const response = await axiosClient.patch(`/admin/users/${id}/role`, { role });
    return response.data || response;
  }
};

export default adminUserService;
