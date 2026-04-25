import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  provider?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (userData: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (userData, token) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true, isLoading: false });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setUser: (userData) => set({ user: userData, isAuthenticated: true, isLoading: false }),
}));
