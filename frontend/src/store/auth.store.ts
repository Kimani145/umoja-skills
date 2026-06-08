import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setAuth: (user: User, access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isHydrating: false,

  setAuth: (user, access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    set({ user, accessToken: access, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    // DEV-ONLY: mock bypass for UI/responsive testing without a backend
    if (import.meta.env.DEV && token === 'mock-ui-test') {
      set({
        user: {
          id: '1',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@umoja.com',
          role: 'CLIENT' as UserRole,
          phone: '0712345678',
          avatar: null,
          location: 'Nairobi',
          is_verified: false,
        },
        isAuthenticated: true,
        isHydrating: false,
      });
      return;
    }
    set({ isHydrating: true });
    try {
      // Dynamically import to avoid circular deps
      const { authApi } = await import('../api/auth');
      const { data } = await authApi.getMe();
      set({ user: data, isAuthenticated: true, isHydrating: false });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false });
    }
  },
}));
