import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://crypto-trading-signals-platform.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // CRITICAL: Remove or set to false
  withCredentials: false,
});

// Request interceptor - Add access token to every request
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 and auto-refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 Refreshing access token...');

        // Call refresh endpoint (create new axios instance to avoid interceptor loop)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'https://crypto-trading-signals-platform.onrender.com/api/v1'}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: false, // CRITICAL
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = data.data.tokens;

        // Update tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update Authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        console.log('✅ Token refreshed successfully');
        return api(originalRequest);

      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Refresh failed - clear storage and redirect to login
        localStorage.clear();
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
