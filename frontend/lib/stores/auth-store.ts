import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { identityApi } from '@/lib/api';
import type { User, LoginRequest, RegisterRequest } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  demoLogin: (user: User, token?: string) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await identityApi.post<{ accessToken: string }>('/auth/login', data);
          const token = res.data.accessToken;
          localStorage.setItem('token', token);
          set({ token });
          await get().fetchMe();
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'فشل تسجيل الدخول';
          set({ error: msg });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await identityApi.post('/auth/register', data);
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'فشل إنشاء الحساب';
          set({ error: msg });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchMe: async () => {
        try {
          const res = await identityApi.get<User>('/auth/me');
          set({ user: res.data });
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch {
          set({ user: null, token: null });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },

      demoLogin: (user, token = 'demo-token') => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, error: null });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
