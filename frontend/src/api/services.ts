import api from './axios';
import { ServiceCategory, ServiceListing, PaginatedResponse } from '../types';

export const servicesApi = {
  getCategories: () => api.get<PaginatedResponse<ServiceCategory>>('/categories/'),

  getServices: (params?: { search?: string; category?: string; service_area?: string; ordering?: string; page?: number }) =>
    api.get<PaginatedResponse<ServiceListing>>('/services/', { params }),

  getServiceById: (id: string) => api.get<ServiceListing>(`/services/${id}/`),

  createService: (data: FormData) =>
    api.post<ServiceListing>('/services/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  updateService: (id: string, data: Partial<ServiceListing>) =>
    api.patch<ServiceListing>(`/services/${id}/`, data),

  deactivateService: (id: string) => api.delete(`/services/${id}/`),

  getProviderProfile: (userId: string) => api.get(`/providers/${userId}/profile/`),
};
