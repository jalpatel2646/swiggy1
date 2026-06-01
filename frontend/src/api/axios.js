import axios from 'axios';

// Create a highly configured Axios instance
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach the JWT token automatically to every outgoing request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('amazon_orders_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global response errors (e.g. 401 Unauthorized, 403 Forbidden)
axiosClient.interceptors.response.use(
  (response) => {
    // Return standard data wrapper
    return response.data;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Check if error is due to an invalid/expired token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Perform a clean logout state cleanup
      localStorage.removeItem('amazon_orders_token');
      localStorage.removeItem('amazon_orders_user');
      
      // We can also trigger a custom window event for AuthContext to sync
      window.dispatchEvent(new Event('amazon_auth_unauthorized'));
      
      // Clean redirect if we are not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Refine API error details to be user-friendly
    const apiError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred.',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors || null,
    };

    return Promise.reject(apiError);
  }
);

export default axiosClient;
