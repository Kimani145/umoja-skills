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
    api.post<{ verification_required?: boolean; challenge_id?: string; detail: string }>('/auth/register/', data),

  login: (email: string, password: string) =>
    api.post<{ verification_required?: boolean; challenge_id?: string; detail: string }>('/auth/login/', { email, password }),

  confirmEmailVerification: (challengeId: string, code: string) =>
    api.post<{ detail: string; user: User; access: string; refresh: string }>('/auth/email-verification/confirm/', {
      challenge_id: challengeId,
      code,
    }),

  getMe: () => api.get<User>('/auth/me/'),

  updateMe: (data: Partial<User>) => api.patch<User>('/auth/me/', data),

  passwordResetRequest: (email: string) =>
    api.post<{ detail: string }>('/auth/password-reset/', { email }),

  passwordResetConfirm: (token: string, password: string) =>
    api.post<{ detail: string }>('/auth/password-reset/confirm/', { token, password }),

  requestVerification: (data: FormData) =>
    api.post<{ detail: string; user: User }>('/auth/verify-profile/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

