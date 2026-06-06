import api from './axios';
import { Review, PaginatedResponse } from '../types';

export const reviewsApi = {
  // POST /api/reviews/create/
  createReview: (data: { booking_id: string; rating: number; comment?: string }) =>
    api.post<Review>('/reviews/create/', data),

  // GET /api/reviews/?provider=<uuid>
  getProviderReviews: (providerId: string) =>
    api.get<PaginatedResponse<Review>>(`/reviews/?provider=${providerId}`),
};
