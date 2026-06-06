export type UserRole = 'CLIENT' | 'PROVIDER';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string | null;
  location: string;
  is_verified: boolean;
  first_name: string;
  last_name: string;
}

export interface ProviderProfile {
  bio: string;
  is_available: boolean;
  years_experience: number;
  cached_rating: number;
  cached_review_count: number;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface ServiceListing {
  id: string;
  provider: User;
  category: ServiceCategory;
  title: string;
  description: string;
  price_kes: string | null;
  service_area: string;
  photos: string[];
  is_active: boolean;
  created_at: string;
  average_rating?: number;
  total_reviews?: number;
}

export interface Booking {
  id: string;
  client: User;
  service: ServiceListing;
  scheduled_at: string;
  notes: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  has_review?: boolean;
}

export interface Review {
  id: string;
  booking: string;
  reviewer: User;
  reviewee: User;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: User;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  last_message?: Message;
  unread_count?: number;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ClientDashboard {
  total_bookings: number;
  completed_jobs_this_month: number;
  reviews_given: number;
  provider_count: number;
  service_count: number;
  recommended_providers: ServiceListing[];
  recent_activities: Activity[];
}

export interface ProviderDashboard {
  total_bookings: number;
  completed_jobs: number;
  total_earnings_kes: number;
  average_rating: number;
  total_reviews: number;
  upcoming_bookings: Booking[];
  recent_reviews: Review[];
}

export interface Activity {
  id: string;
  type: 'message' | 'booking' | 'review' | 'provider_joined';
  text: string;
  timestamp: string;
}
