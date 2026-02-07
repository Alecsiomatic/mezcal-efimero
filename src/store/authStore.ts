import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  lastName2?: string;
  phone?: string;
  country?: string;
  state?: string;
  isAdmin: boolean;
  createdAt?: string;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateProfile: (userData: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  lastName2?: string;
  phone?: string;
  country?: string;
  state?: string;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, token: data.accessToken, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Error al iniciar sesión', isLoading: false });
          return false;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', userData);
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, token: data.accessToken, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Error al registrarse', isLoading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user, token });
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({ user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),

      updateProfile: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      }
    }),
    { 
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
);

export { useAuthStore };
export default useAuthStore;
