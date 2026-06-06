import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { UserRole } from '../types';

interface Props {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, user, isHydrating, hydrate } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // If authenticated (token exists) but no user data yet, hydrate
    if (isAuthenticated && !user && !isHydrating) {
      hydrate();
    }
  }, [isAuthenticated, user, isHydrating, hydrate]);

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${location.pathname}`} replace />;
  }

  // Show nothing while hydrating user data
  if (isAuthenticated && !user && isHydrating) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-text-secondary)',
        fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
