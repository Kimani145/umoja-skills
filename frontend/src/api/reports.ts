import api from './axios';
import { AccountReport } from '../types';

export const reportAccount = async (
  reportedUserId: string,
  reason: string,
  evidence: string,
  screenshot?: File | null
) => {
  const formData = new FormData();
  formData.append('reported_user_id', reportedUserId);
  formData.append('reason', reason);
  formData.append('evidence', evidence);
  if (screenshot) {
    formData.append('screenshot', screenshot);
  }

  const { data } = await api.post('/reports/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getAdminReports = async (): Promise<AccountReport[]> => {
  const { data } = await api.get<AccountReport[]>('/admin/reports/');
  return data;
};

export const resolveReport = async (
  reportId: string,
  status: 'RESOLVED' | 'DISMISSED'
) => {
  const { data } = await api.post(`/admin/reports/${reportId}/resolve/`, { status });
  return data;
};

export const toggleSuspendUser = async (
  userId: string
): Promise<{ detail: string; is_active: boolean }> => {
  const { data } = await api.post(`/admin/users/${userId}/toggle-suspend/`);
  return data;
};
