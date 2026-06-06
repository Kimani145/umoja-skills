import api from './axios';
import { User } from '../types';

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    role: string;
    phone?: string;
    location?: string;
    first_name: string;
    last_name: string;
  }) =>
    api.post<{ user: User; access: string; refresh: string }>('/auth/register/', data),

  login: (email: string, password: string) =>
    api.post<{ user: User; access: string; refresh: string }>('/auth/login/', { email, password }),

  getMe: () => api.get<User>('/auth/me/'),

  updateMe: (data: Partial<User>) => api.patch<User>('/auth/me/', data),
};
