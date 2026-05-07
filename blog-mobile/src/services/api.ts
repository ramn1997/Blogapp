import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

// Detected your machine's IP as 192.168.1.8
// For Android Emulators, 10.0.2.2 always points to your machine's localhost.
export const MACHINE_IP = '192.168.1.6'; 
const DEV_API = `http://${MACHINE_IP}:5204`;
const PROD_API = 'https://scribeflow-api-c9d9dhg5c3g3d4hn.centralus-01.azurewebsites.net';

export const API_BASE_URL = __DEV__ ? DEV_API : PROD_API;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: __DEV__ ? 15000 : 30000, // 30s for production cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple in-memory cache for GET requests
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Interceptor to add auth token and handle caching
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Handle caching for GET requests
  if (config.method === 'get') {
    const cacheKey = config.url + JSON.stringify(config.params || {});
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      config.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to store responses in cache
api.interceptors.response.use((response) => {
  if (response.config.method === 'get' && response.status === 200) {
    const cacheKey = response.config.url + JSON.stringify(response.config.params || {});
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
  }
  return response;
}, (error) => {
  return Promise.reject(error);
});

export default api;
