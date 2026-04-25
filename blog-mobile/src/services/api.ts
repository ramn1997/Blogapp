import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

// Detected your machine's IP as 192.168.1.8
// For Android Emulators, 10.0.2.2 always points to your machine's localhost.
const MACHINE_IP = '192.168.1.4'; 
export const API_BASE_URL = MACHINE_IP 
  ? `http://${MACHINE_IP}:5204` 
  : (Platform.OS === 'android' ? 'http://10.0.2.2:5204' : 'http://localhost:5204');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // Add timeout to help debug connection issues
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
