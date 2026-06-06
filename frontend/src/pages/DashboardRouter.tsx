import { useAuthStore } from '../store/auth.store';
import ClientDashboardPage from './client/ClientDashboardPage';
import ProviderDashboardPage from './provider/ProviderDashboardPage';
import BookingsPage from './client/BookingsPage';
import ProviderBookingsPage from './provider/ProviderBookingsPage';

interface Props { bookingsOnly?: boolean; }

export default function DashboardRouter({ bookingsOnly }: Props) {
  const { user } = useAuthStore();

  if (bookingsOnly) {
    return user?.role === 'PROVIDER' ? <ProviderBookingsPage /> : <BookingsPage />;
  }

  return user?.role === 'PROVIDER' ? <ProviderDashboardPage /> : <ClientDashboardPage />;
}
