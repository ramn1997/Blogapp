import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

// Detected your machine's IP as 192.168.1.8
// For Android Emulators, 10.0.2.2 always points to your machine's localhost.
const MACHINE_IP = '192.168.1.6'; 
const DEV_API = `http://${MACHINE_IP}:5204`;
const PROD_API = 'https://scribeflow-api-c9d9dhg5c3g3d4hn.centralus-01.azurewebsites.net';

export const API_BASE_URL = __DEV__ ? DEV_API : PROD_API;

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
