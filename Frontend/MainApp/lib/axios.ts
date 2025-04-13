import axios from 'axios';

// Create axios instance with default config

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for handling auth tokens if needed
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add authentication tokens here if needed
    // Example: const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    // Example: handle 401 Unauthorized errors
    // if (error.response && error.response.status === 401) {
    //   // Handle session expiration, logout user, etc.
    // }
    return Promise.reject(error);
  }
);

export default axiosInstance;
