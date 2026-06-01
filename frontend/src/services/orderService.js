import axiosClient from '../api/axios';

export const orderService = {
  getOrders: async (params) => {
    // API endpoint supports sorting, filtering, and pagination
    return axiosClient.get('/orders', { params });
  },

  getOrderById: async (id) => {
    return axiosClient.get(`/orders/${id}`);
  },

  createOrder: async (orderData) => {
    return axiosClient.post('/orders', orderData);
  },

  updateOrder: async (id, orderData) => {
    return axiosClient.put(`/orders/${id}`, orderData);
  },

  deleteOrder: async (id) => {
    return axiosClient.delete(`/orders/${id}`);
  },

  // Phase 9 Bulk Operations
  bulkUpdateStatus: async (orderIds, status) => {
    return axiosClient.post('/orders/bulk', { ids: orderIds, status });
  },

  // Analytics endpoint
  getOrderAnalytics: async () => {
    return axiosClient.get('/admin/analytics');
  }
};

export default orderService;
