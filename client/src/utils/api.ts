import axios from 'axios';

// Get API base URL from env or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial to send/receive secure refresh token cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

let store: any; // We will inject the Redux store here to avoid circular dependencies

export const injectStore = (_store: any) => {
  store = _store;
};

// Request Interceptor: Inject JWT token into headers if present in state
api.interceptors.request.use(
  (config) => {
    const token = store?.getState()?.auth?.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 errors and attempt automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Do not attempt refresh on auth endpoints (login, register, refresh)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/forgot-password');

    // Check if error is 401 Unauthorized and not already retried and not an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      
      try {
        // Try calling the refresh endpoint to obtain new credentials
        const response = await axios.get(`${API_URL}/auth/refresh`, {
          withCredentials: true
        });
        
        const { token, user } = response.data;
        
        // Dispatch actions to update state with new tokens
        if (store) {
          const { setCredentials } = await import('../store/authSlice');
          store.dispatch(setCredentials({ token, user }));
        }
        
        // Retry the original request with new auth token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth credentials and force logout
        if (store) {
          const { clearCredentials } = await import('../store/authSlice');
          store.dispatch(clearCredentials());
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
