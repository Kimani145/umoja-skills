import api from './axios';
import { Booking, PaginatedResponse } from '../types';

export const bookingsApi = {
  getBookings: () => api.get<PaginatedResponse<Booking>>('/bookings/'),

  createBooking: (data: { service_id: string; scheduled_at: string; notes?: string }) =>
    api.post<Booking>('/bookings/', data),

  getBooking: (id: string) => api.get<Booking>(`/bookings/${id}/`),

  // DRF router generates: /bookings/{id}/update_status/
  updateStatus: (id: string, status: string) =>
    api.patch<Booking>(`/bookings/${id}/update_status/`, { status }),
};
