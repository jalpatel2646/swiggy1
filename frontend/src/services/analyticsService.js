import axiosClient from '../api/axios';

const analyticsService = {
  /**
   * Fetches aggregated sales report
   * @param {string} startDate - ISO Date String
   * @param {string} endDate - ISO Date String
   * @param {string} groupBy - 'day', 'month', 'year'
   * @returns {Promise<Object>}
   */
  getSalesReport: async (startDate, endDate, groupBy = 'day') => {
    try {
      const response = await axiosClient.get('/admin/reports/sales', {
        params: { startDate, endDate, groupBy }
      });
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
      throw error;
    }
  },

  /**
   * Fetches revenue breakdown report
   * @param {string} startDate - ISO Date String
   * @param {string} endDate - ISO Date String
   * @param {string} groupBy - 'day', 'month', 'year'
   * @returns {Promise<Object>}
   */
  getRevenueReport: async (startDate, endDate, groupBy = 'day') => {
    try {
      const response = await axiosClient.get('/admin/reports/revenue', {
        params: { startDate, endDate, groupBy }
      });
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
      throw error;
    }
  },

  /**
   * Fetches system health telemetry
   * @returns {Promise<Object>}
   */
  getSystemHealth: async () => {
    try {
      const response = await axiosClient.get('/admin/system/health');
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  }
};

export default analyticsService;
