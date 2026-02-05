import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  error => {
    // Log detailed error information for debugging
    const isNetworkError = !error?.response;
    const status = error?.response?.status;
    const url = error?.config?.url;
    const method = error?.config?.method;
    
    console.error('API Error Details:', {
      status,
      url,
      method,
      message: error?.message,
      responseData: error?.response?.data,
      isNetworkError,
      baseURL: error?.config?.baseURL,
      timeout: error?.config?.timeout,
    });

    if (isNetworkError) {
      console.error('Network Error: Backend server not responding at', error?.config?.baseURL);
      console.error('Check if backend is running and reachable');
    }

    // ✅ IMPORTANT: Return the original error so downstream can access error.response.status and error.response.data
    return Promise.reject(error);
  },
);

export default apiClient;
