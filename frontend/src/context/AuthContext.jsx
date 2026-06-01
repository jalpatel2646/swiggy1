/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('amazon_orders_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('amazon_orders_token') || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const handleLogoutCleanup = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('amazon_orders_token');
    localStorage.removeItem('amazon_orders_user');
  };

  // Synchronize authentication validation state on mount
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          // Fetch current profile to validate the stored token
          const response = await axiosClient.get('/auth/profile');
          const userData = response.data || response;
          setUser(userData);
          localStorage.setItem('amazon_orders_user', JSON.stringify(userData));
        } catch (error) {
          console.error('Session validation failed:', error.message);
          // Token expired or invalid
          handleLogoutCleanup();
        }
      }
      setIsLoading(false);
    };

    verifySession();

    // Event listener for global 401 interceptor trigger
    const handleUnauthorizedEvent = () => {
      handleLogoutCleanup();
    };

    window.addEventListener('amazon_auth_unauthorized', handleUnauthorizedEvent);
    return () => {
      window.removeEventListener('amazon_auth_unauthorized', handleUnauthorizedEvent);
    };
  }, [token]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      
      // Adapt base response format
      const data = response.data || response;
      const userToken = data.token;
      const userData = data.user;

      if (!userToken || !userData) {
        throw new Error('Invalid authentication response from backend.');
      }

      localStorage.setItem('amazon_orders_token', userToken);
      localStorage.setItem('amazon_orders_user', JSON.stringify(userData));
      
      setToken(userToken);
      setUser(userData);
      setIsLoading(false);
      return userData;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Proactively notify backend if required
      await axiosClient.post('/auth/logout').catch(() => {});
    } finally {
      handleLogoutCleanup();
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post('/auth/register', { name, email, password });
      setIsLoading(false);
      return response.data || response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
