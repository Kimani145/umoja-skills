from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta, date
from bookings.models import Booking
from reviews.models import Review
from services.models import ServiceListing


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_dashboard(request):
    user = request.user

    total_bookings = Booking.objects.filter(client=user).count()
    completed_this_month = Booking.objects.filter(
        client=user,
        status='COMPLETED',
        updated_at__month=timezone.now().month,
        updated_at__year=timezone.now().year
    ).count()
    reviews_given = Review.objects.filter(reviewer=user).count()

    # Count available providers and services
    from django.contrib.auth import get_user_model
    User = get_user_model()
    provider_count = User.objects.filter(role='PROVIDER').count()
    service_count = ServiceListing.objects.filter(is_active=True).count()

    # Recommended: newest active listings (avoid ordering by property)
    recommended_providers = ServiceListing.objects.filter(
        is_active=True
    ).select_related('provider', 'category').order_by('-created_at')[:6]

    # Recent bookings as activity
    recent_bookings = Booking.objects.filter(
        client=user
    ).select_related('service', 'service__provider').order_by('-created_at')[:5]

    recent_activities = []
    for b in recent_bookings:
        recent_activities.append({
            'id': str(b.id),
            'type': 'booking',
            'text': f'Booking for {b.service.title} is {b.status.lower()}',
            'timestamp': b.created_at.isoformat(),
        })

    from services.serializers import ServiceListingSerializer
    return Response({
        'total_bookings': total_bookings,
        'completed_jobs_this_month': completed_this_month,
        'reviews_given': reviews_given,
        'provider_count': provider_count,
        'service_count': service_count,
        'recommended_providers': ServiceListingSerializer(recommended_providers, many=True).data,
        'recent_activities': recent_activities,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def provider_dashboard(request):
    user = request.user
    
    bookings = Booking.objects.filter(service__provider=user)
    total_bookings = bookings.count()
    completed_jobs = bookings.filter(status='COMPLETED').count()
    
    total_earnings = sum(
        float(b.service.price_kes or 0) for b in bookings.filter(status='COMPLETED')
    )
    
    reviews = Review.objects.filter(reviewee=user)
    average_rating = (
        sum(r.rating for r in reviews) / reviews.count() if reviews.exists() else 0
    )
    
    upcoming_bookings = bookings.filter(
        scheduled_at__gte=timezone.now(),
        status__in=['PENDING', 'CONFIRMED']
    ).order_by('scheduled_at')[:5]
    
    recent_reviews = reviews.order_by('-created_at')[:3]
    
    from bookings.serializers import BookingSerializer
    from reviews.serializers import ReviewSerializer
    
    return Response({
        'total_bookings': total_bookings,
        'completed_jobs': completed_jobs,
        'total_earnings_kes': total_earnings,
        'average_rating': average_rating,
        'upcoming_bookings': BookingSerializer(upcoming_bookings, many=True).data,
        'recent_reviews': ReviewSerializer(recent_reviews, many=True).data,
    })
