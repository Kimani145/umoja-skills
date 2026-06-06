import api from './axios';
import { ClientDashboard, ProviderDashboard } from '../types';

export const dashboardApi = {
  getClientDashboard: () => api.get<ClientDashboard>('/dashboard/client/'),
  getProviderDashboard: () => api.get<ProviderDashboard>('/dashboard/provider/'),
  getEarningsBreakdown: () => api.get('/earnings/'),
};
