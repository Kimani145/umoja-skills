"""
Root URL routing for core project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework import routers

from users.views import (
    RegisterView, LoginView, UserMeView, VerifyProfileView,
    ClientDashboardView, ProviderDashboardView,
    SavedProviderView, EarningsBreakdownView,
    PasswordResetRequestView, PasswordResetConfirmView,
)
from services.views import ServiceCategoryViewSet, ServiceListingViewSet, ProviderProfileView
from bookings.views import BookingViewSet
from reviews.views import ReviewCreateView, ReviewListView
from messaging.views import ConversationViewSet, MessageViewSet, TypingView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def health(request):
    return JsonResponse({'status': 'ok'})


router = routers.DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet, basename='category')
router.register(r'services', ServiceListingViewSet, basename='service')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(
    r'conversations/(?P<conversation_id>[^/.]+)/messages',
    MessageViewSet,
    basename='message',
)

urlpatterns = [
    path('umoja-mgmt/', admin.site.urls),

    # Health check
    path('api/health/', health, name='health'),

    # Auth
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', UserMeView.as_view(), name='user_me'),
    path('api/auth/verify-profile/', VerifyProfileView.as_view(), name='verify_profile'),
    path('api/auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('api/auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Dashboard
    path('api/dashboard/client/', ClientDashboardView.as_view(), name='client_dashboard'),
    path('api/dashboard/provider/', ProviderDashboardView.as_view(), name='provider_dashboard'),

    # Saved providers + Earnings
    path('api/saved/', SavedProviderView.as_view(), name='saved_providers'),
    path('api/earnings/', EarningsBreakdownView.as_view(), name='earnings_breakdown'),

    # Reviews
    path('api/reviews/', ReviewListView.as_view(), name='review_list'),
    path('api/reviews/create/', ReviewCreateView.as_view(), name='review_create'),

    # Provider public profile
    path('api/providers/<uuid:user_id>/profile/', ProviderProfileView.as_view(), name='provider_profile'),

    # Typing indicator
    path('api/conversations/<uuid:conversation_id>/typing/', TypingView.as_view(), name='typing'),

    # API routers (services, bookings, conversations, messages)
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
