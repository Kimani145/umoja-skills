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
  }) => {
    console.log('[authApi] register() called with email:', data.email);
    return api.post<{ verification_required?: boolean; challenge_id?: string; detail: string; access?: string; refresh?: string; user?: User }>('/auth/register/', data);
  },

  login: (email: string, password: string) => {
    console.log('[authApi] login() called with email:', email);
    return api.post<{ verification_required?: boolean; challenge_id?: string; detail: string; access?: string; refresh?: string; user?: User }>('/auth/login/', { email, password });
  },

  confirmEmailVerification: (challengeId: string, code: string) => {
    console.log('[authApi] confirmEmailVerification() called with challengeId:', challengeId);
    return api.post<{ detail: string; user: User; access: string; refresh: string }>('/auth/email-verification/confirm/', {
      challenge_id: challengeId,
      code,
    });
  },

  getMe: () => {
    console.log('[authApi] getMe() called');
    return api.get<User>('/auth/me/');
  },

  updateMe: (data: Partial<User>) => {
    console.log('[authApi] updateMe() called');
    return api.patch<User>('/auth/me/', data);
  },

  passwordResetRequest: (email: string) => {
    console.log('[authApi] passwordResetRequest() called with email:', email);
    return api.post<{ detail: string }>('/auth/password-reset/', { email });
  },

  passwordResetConfirm: (token: string, password: string) => {
    console.log('[authApi] passwordResetConfirm() called');
    return api.post<{ detail: string }>('/auth/password-reset/confirm/', { token, password });
  },

  requestVerification: (data: FormData) => {
    console.log('[authApi] requestVerification() called');
    return api.post<{ detail: string; user: User }>('/auth/verify-profile/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

