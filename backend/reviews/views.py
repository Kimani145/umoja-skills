from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Review
from .serializers import ReviewSerializer


class ReviewCreateView(generics.CreateAPIView):
    """POST /api/reviews/create/ — create a review for a completed booking."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role != 'CLIENT':
            return Response(
                {'detail': 'Only clients can submit reviews.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)


class ReviewListView(generics.ListAPIView):
    """GET /api/reviews/?provider=<uuid> — public list of reviews for a provider."""
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider')
        qs = Review.objects.select_related('reviewer', 'reviewee').all()
        if provider_id:
            qs = qs.filter(reviewee__id=provider_id)
        return qs
