from rest_framework import generics, status, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings as django_settings
from .models import User, ProviderProfile, SavedProvider, PasswordResetToken, VerificationRequest, AccountReport, AdminActivityLog, EmailVerificationChallenge
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    EmailVerificationConfirmSerializer,
    VerificationRequestSerializer,
    AccountReportSerializer,
    AdminActivityLogSerializer,
)
from django.db.models.functions import TruncMonth
from django.db.models import Sum, Count



class RegisterView(APIView):
    """Register a new user and send an email verification challenge."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = serializer.save()
                # Auto-create ProviderProfile for PROVIDER role
                if user.role == 'PROVIDER':
                    ProviderProfile.objects.get_or_create(user=user)

                challenge = EmailVerificationChallenge.create_for_user(
                    user,
                    EmailVerificationChallenge.PURPOSE_REGISTER,
                )
                self._send_verification_email(user, challenge, purpose_label='sign-up')

            return Response({
                'verification_required': True,
                'challenge_id': str(challenge.id),
                'detail': 'We sent a confirmation code to your email. Enter it to finish signing up.',
            }, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            import traceback
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def _send_verification_email(user, challenge, purpose_label):
        send_mail(
            subject='Confirm your Umoja Skills account',
            message=(
                f"Hi {user.first_name},\n\n"
                f"Use this one-time code to finish your {purpose_label}:\n\n"
                f"{challenge.code}\n\n"
                f"The code expires in 10 minutes. If you did not request this, ignore this email.\n\n"
                f"- The Umoja Skills Team"
            ),
            from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'noreply@umoja-skills.com'),
            recipient_list=[user.email],
            fail_silently=False,
        )


class LoginView(APIView):
    """Authenticate a user and send an email verification challenge."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        try:
            with transaction.atomic():
                challenge = EmailVerificationChallenge.create_for_user(
                    user,
                    EmailVerificationChallenge.PURPOSE_LOGIN,
                )
                self._send_verification_email(user, challenge)
        except Exception as exc:
            return Response({'detail': f'Unable to send verification email: {exc}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({
            'verification_required': True,
            'challenge_id': str(challenge.id),
            'detail': 'We sent a confirmation code to your email. Enter it to finish signing in.',
        }, status=status.HTTP_202_ACCEPTED)

    @staticmethod
    def _send_verification_email(user, challenge):
        send_mail(
            subject='Confirm your Umoja Skills sign-in',
            message=(
                f"Hi {user.first_name},\n\n"
                f"Use this one-time code to finish your sign-in:\n\n"
                f"{challenge.code}\n\n"
                f"The code expires in 10 minutes. If you did not request this, you can ignore this email.\n\n"
                f"- The Umoja Skills Team"
            ),
            from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'noreply@umoja-skills.com'),
            recipient_list=[user.email],
            fail_silently=False,
        )


class EmailVerificationConfirmView(APIView):
    """Confirm a one-time email verification code and issue JWTs."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            challenge = EmailVerificationChallenge.objects.select_related('user').get(
                id=serializer.validated_data['challenge_id']
            )
        except EmailVerificationChallenge.DoesNotExist:
            return Response({'detail': 'Verification code is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        if not challenge.is_valid(serializer.validated_data['code']):
            return Response({'detail': 'Verification code is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        challenge.used = True
        challenge.save(update_fields=['used'])

        user = challenge.user
        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=['email_verified'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': 'Email confirmed successfully.',
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class UserMeView(APIView):
    """Get or update the authenticated user's own profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyProfileView(APIView):
    """
    POST /api/auth/verify-profile/
    Allows a user to submit a verification request.
    In testing/dev environment, we auto-approve the request so their profile becomes verified immediately.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerificationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create verification request record (stays PENDING for admin review)
        verification_req = serializer.save(user=request.user)

        return Response({
            'detail': 'Verification request submitted successfully. '
                      'Our team will review it within 24-48 hours.',
            'request_id': str(verification_req.id),
            'status': 'PENDING',
        }, status=status.HTTP_200_OK)



class ClientDashboardView(APIView):
    """Dashboard data for CLIENT users."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from bookings.models import Booking
        from reviews.models import Review
        from services.models import ServiceListing
        from services.serializers import ServiceListingSerializer

        user = request.user
        now = timezone.now()

        completed_this_month = Booking.objects.filter(
            client=user,
            status='COMPLETED',
            updated_at__month=now.month,
            updated_at__year=now.year,
        ).count()

        reviews_given = Review.objects.filter(reviewer=user).count()
        provider_count = User.objects.filter(role='PROVIDER').count()
        service_count = ServiceListing.objects.filter(is_active=True).count()

        recommended = ServiceListing.objects.all().select_related('provider', 'category').order_by('-created_at')[:6]

        recent_bookings = Booking.objects.filter(
            client=user
        ).select_related('service', 'service__provider').order_by('-created_at')[:5]

        activities = [{
            'id': str(b.id),
            'type': 'booking',
            'text': f'Booking for {b.service.title} is {b.status.lower()}',
            'timestamp': b.created_at.isoformat(),
        } for b in recent_bookings]

        return Response({
            'total_bookings': Booking.objects.filter(client=user).count(),
            'completed_jobs_this_month': completed_this_month,
            'reviews_given': reviews_given,
            'provider_count': provider_count,
            'service_count': service_count,
            'recommended_providers': ServiceListingSerializer(
                recommended, many=True, context={'request': request}
            ).data,
            'recent_activities': activities,
        })


class ProviderDashboardView(APIView):
    """Dashboard data for PROVIDER users."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from bookings.models import Booking
        from reviews.models import Review
        from bookings.serializers import BookingSerializer
        from reviews.serializers import ReviewSerializer

        user = request.user
        now = timezone.now()

        all_bookings = Booking.objects.filter(
            service__provider=user
        ).select_related('client', 'service', 'service__category')

        completed = all_bookings.filter(status='COMPLETED')

        total_earnings = sum(
            float(b.service.price_kes or 0) for b in completed
        )

        upcoming = all_bookings.filter(
            status__in=['PENDING', 'CONFIRMED'],
            scheduled_at__gte=now,
        ).order_by('scheduled_at')[:5]

        recent_reviews = Review.objects.filter(
            reviewee=user
        ).select_related('reviewer').order_by('-created_at')[:5]

        profile = getattr(user, 'provider_profile', None)

        return Response({
            'total_bookings': all_bookings.count(),
            'completed_jobs': completed.count(),
            'total_earnings_kes': total_earnings,
            'average_rating': float(profile.cached_rating) if profile else 0,
            'total_reviews': profile.cached_review_count if profile else 0,
            'upcoming_bookings': BookingSerializer(
                upcoming, many=True, context={'request': request}
            ).data,
            'recent_reviews': ReviewSerializer(recent_reviews, many=True).data,
        })


class SavedProviderView(APIView):
    """GET/POST/DELETE saved service listings for the authenticated client."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from services.serializers import ServiceListingSerializer
        saved = SavedProvider.objects.filter(
            user=request.user
        ).select_related('service', 'service__provider', 'service__category')
        data = [ServiceListingSerializer(s.service, context={'request': request}).data for s in saved]
        return Response(data)

    def post(self, request):
        service_id = request.data.get('service_id')
        if not service_id:
            return Response({'detail': 'service_id required.'}, status=status.HTTP_400_BAD_REQUEST)
        from services.models import ServiceListing
        try:
            service = ServiceListing.objects.get(id=service_id, is_active=True)
        except ServiceListing.DoesNotExist:
            return Response({'detail': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj, created = SavedProvider.objects.get_or_create(user=request.user, service=service)
        return Response(
            {'saved': True, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def delete(self, request):
        service_id = request.data.get('service_id')
        deleted, _ = SavedProvider.objects.filter(
            user=request.user, service_id=service_id
        ).delete()
        return Response({'saved': False, 'deleted': bool(deleted)})


class EarningsBreakdownView(APIView):
    """Per-job and monthly earnings breakdown for PROVIDER users."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from bookings.models import Booking

        user = request.user
        completed = Booking.objects.filter(
            service__provider=user,
            status='COMPLETED'
        ).select_related('client', 'service', 'service__category').order_by('-updated_at')

        # Per-booking breakdown
        breakdown = []
        for b in completed:
            breakdown.append({
                'id': str(b.id),
                'client_name': f"{b.client.first_name} {b.client.last_name}",
                'service_title': b.service.title,
                'category': b.service.category.name,
                'amount_kes': float(b.service.price_kes or 0),
                'completed_at': b.updated_at.isoformat(),
            })

        # Monthly aggregation
        monthly = completed.annotate(
            month=TruncMonth('updated_at')
        ).values('month').annotate(
            total=Sum('service__price_kes'),
            jobs=Count('id')
        ).order_by('-month')

        monthly_data = [
            {
                'month': m['month'].strftime('%B %Y'),
                'total_kes': float(m['total'] or 0),
                'jobs': m['jobs'],
            }
            for m in monthly
        ]

        total = sum(b['amount_kes'] for b in breakdown)

        return Response({
            'total_lifetime_kes': total,
            'breakdown': breakdown[:50],
            'monthly': monthly_data[:12],
        })


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/
    Body: { "email": "user@example.com" }
    Always returns 200 to prevent email enumeration.
    If the email exists, sends a reset link.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        generic_response = Response(
            {'detail': 'If an account with that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return generic_response

        # Create the token
        reset = PasswordResetToken.create_for_user(user)

        # Build the reset URL (frontend)
        frontend_url = getattr(django_settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend_url}/reset-password?token={reset.token}"

        # Send the email
        try:
            send_mail(
                subject='Reset your Umoja Skills password',
                message=(
                    f"Hi {user.first_name},\n\n"
                    f"We received a request to reset your Umoja Skills password.\n\n"
                    f"Click the link below to set a new password. "
                    f"This link expires in 1 hour.\n\n"
                    f"{reset_url}\n\n"
                    f"If you didn't request this, you can safely ignore this email.\n\n"
                    f"– The Umoja Skills Team"
                ),
                from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'noreply@umoja-skills.com'),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            # Log but don't expose the error to the client
            import logging
            logging.getLogger(__name__).exception("Failed to send password reset email to %s", email)

        return generic_response


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/
    Body: { "token": "...", "password": "NewPass1" }
    Validates the token and sets the new password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('token', '').strip()
        new_password = request.data.get('password', '')

        if not token_str or not new_password:
            return Response(
                {'detail': 'token and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reset = PasswordResetToken.objects.select_related('user').get(token=token_str)
        except PasswordResetToken.DoesNotExist:
            return Response(
                {'detail': 'This reset link is invalid or has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not reset.is_valid():
            return Response(
                {'detail': 'This reset link has expired or already been used. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset.user
        user.set_password(new_password)
        user.save(update_fields=['password'])

        reset.used = True
        reset.save(update_fields=['used'])

        return Response({'detail': 'Password updated successfully. You can now sign in.'})


class ReportCreateView(generics.CreateAPIView):
    """Allows authenticated users to report accounts."""
    permission_classes = [IsAuthenticated]
    serializer_class = AccountReportSerializer

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class AdminReportListView(generics.ListAPIView):
    """Allows staff/admin to view all reported accounts, screenshots, and evidence."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AccountReportSerializer
    queryset = AccountReport.objects.all().select_related('reporter', 'reported_user')
    pagination_class = None


class AdminReportResolveView(APIView):
    """Allows staff/admin to resolve or dismiss a report."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, report_id):
        try:
            report = AccountReport.objects.get(id=report_id)
        except AccountReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['RESOLVED', 'DISMISSED']:
            return Response({'detail': 'Invalid status. Choose RESOLVED or DISMISSED.'}, status=status.HTTP_400_BAD_REQUEST)

        report.status = new_status
        report.save(update_fields=['status'])

        # Create Activity Log for accountability
        AdminActivityLog.objects.create(
            admin=request.user,
            action_type='RESOLVE_REPORT' if new_status == 'RESOLVED' else 'DISMISS_REPORT',
            target_user=report.reported_user,
            details=f"Admin marked report #{report.id} against {report.reported_user.email} as {new_status.lower()}."
        )

        return Response({'detail': f'Report status updated to {new_status}.'})


class AdminUserSuspendView(APIView):
    """Allows staff/admin to suspend or unsuspend a user account (reversible process)."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent suspending oneself
        if user == request.user:
            return Response({'detail': 'You cannot suspend your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])

        action_taken = "suspended" if not user.is_active else "activated"

        # Create Activity Log for accountability
        AdminActivityLog.objects.create(
            admin=request.user,
            action_type='SUSPEND_USER' if action_taken == 'suspended' else 'REACTIVATE_USER',
            target_user=user,
            details=f"Admin {action_taken} user account {user.email}."
        )

        return Response({
            'detail': f'User {user.email} has been successfully {action_taken}.',
            'is_active': user.is_active
        })


class AdminUserListView(generics.ListAPIView):
    """Allows staff/admin to view all user accounts in the system."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-date_joined')
    pagination_class = None


class AdminActivityLogListView(generics.ListAPIView):
    """Allows staff/admin to view administrative audit logs."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminActivityLogSerializer
    queryset = AdminActivityLog.objects.all().select_related('admin', 'target_user')
    pagination_class = None


class AdminChangePasswordView(APIView):
    """Allows staff/admin to change their own password securely."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response({'detail': 'Both current and new passwords are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(current_password):
            return Response({'detail': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'detail': 'New password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Create Activity Log for accountability
        AdminActivityLog.objects.create(
            admin=user,
            action_type='CHANGE_PASSWORD',
            target_user=user,
            details="Admin successfully changed their own password."
        )

        return Response({'detail': 'Password changed successfully.'})



