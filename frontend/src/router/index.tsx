import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardRouter from '../pages/DashboardRouter';
import SearchPage from '../pages/client/SearchPage';
import ProviderProfilePage from '../pages/client/ProviderProfilePage';
import MessagesPage from '../pages/shared/MessagesPage';
import ProfilePage from '../pages/shared/ProfilePage';
import SettingsPage from '../pages/shared/SettingsPage';
import SavedProvidersPage from '../pages/client/SavedProvidersPage';
import MyServicesPage from '../pages/provider/MyServicesPage';
import AddServicePage from '../pages/provider/AddServicePage';
import EarningsPage from '../pages/provider/EarningsPage';
import AdminDashboardPage from '../pages/shared/AdminDashboardPage';
import AdminLoginPage from '../pages/auth/AdminLoginPage';
import AdminUserManagementPage from '../pages/shared/AdminUserManagementPage';
import AdminActivityLogPage from '../pages/shared/AdminActivityLogPage';
import AdminProfilePage from '../pages/shared/AdminProfilePage';

export const router = createBrowserRouter([
  { path: '/login',           element: <LoginPage /> },
  { path: '/register',        element: <RegisterPage /> },
  { path: '/admin/login',     element: <AdminLoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password',  element: <ResetPasswordPage /> },
  {
    path: '/admin',
    element: <ProtectedRoute requireStaff><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUserManagementPage /> },
      { path: 'logs', element: <AdminActivityLogPage /> },
      { path: 'profile', element: <AdminProfilePage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardRouter /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'providers/:id', element: <ProviderProfilePage /> },
      { path: 'bookings', element: <DashboardRouter bookingsOnly /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'messages/:conversationId', element: <MessagesPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      {
        path: 'saved',
        element: <ProtectedRoute requiredRole="CLIENT"><SavedProvidersPage /></ProtectedRoute>,
      },
      {
        path: 'my-services',
        element: <ProtectedRoute requiredRole="PROVIDER"><MyServicesPage /></ProtectedRoute>,
      },
      {
        path: 'my-services/add',
        element: <ProtectedRoute requiredRole="PROVIDER"><AddServicePage /></ProtectedRoute>,
      },
      {
        path: 'my-services/:id/edit',
        element: <ProtectedRoute requiredRole="PROVIDER"><AddServicePage /></ProtectedRoute>,
      },
      {
        path: 'earnings',
        element: <ProtectedRoute requiredRole="PROVIDER"><EarningsPage /></ProtectedRoute>,
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

