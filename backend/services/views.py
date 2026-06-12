import django_filters
from django.db.models import Q
from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import ServiceCategory, ServiceListing
from .serializers import ServiceCategorySerializer, ServiceListingSerializer
from users.serializers import UserSerializer


class ServiceListingFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__slug')
    service_area = django_filters.CharFilter(method='filter_service_area')

    class Meta:
        model = ServiceListing
        fields = ['category', 'service_area']

    def filter_service_area(self, queryset, name, value):
        if not value:
            return queryset
        # Match case-insensitively in either the listing's service area or the provider's location
        return queryset.filter(
            Q(service_area__icontains=value) | Q(provider__location__icontains=value)
        )


class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class ServiceListingViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceListingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ServiceListingFilter
    search_fields = ['title', 'description', 'service_area']
    ordering_fields = ['price_kes', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        # Temporarily dropping .filter(is_active=True) to test if all test providers appear
        return ServiceListing.objects.all().select_related('provider', 'provider__provider_profile', 'category')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()

    def perform_create(self, serializer):
        if self.request.user.role != 'PROVIDER':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only providers can create services.')
        serializer.save(provider=self.request.user)

    def perform_destroy(self, instance):
        # Soft-delete
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def deactivate(self, request, pk=None):
        service = self.get_object()
        if service.provider != request.user:
            return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        service.is_active = False
        service.save()
        return Response({'detail': 'Service deactivated.'})


class ProviderProfileView(APIView):
    """
    Public provider profile. Returns user info, provider_profile metadata,
    and list of active services.
    """
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        from users.models import User
        try:
            user = User.objects.select_related('provider_profile').get(
                id=user_id, role='PROVIDER'
            )
        except User.DoesNotExist:
            return Response({'detail': 'Provider not found.'}, status=status.HTTP_404_NOT_FOUND)

        services = ServiceListing.objects.filter(
            provider=user, is_active=True
        ).select_related('category')

        profile = getattr(user, 'provider_profile', None)

        return Response({
            'user': UserSerializer(user).data,
            'provider_profile': {
                'bio': profile.bio if profile else '',
                'is_available': profile.is_available if profile else False,
                'years_experience': profile.years_experience if profile else 0,
                'cached_rating': float(profile.cached_rating) if profile else 0,
                'cached_review_count': profile.cached_review_count if profile else 0,
            },
            'services': ServiceListingSerializer(
                services, many=True, context={'request': request}
            ).data,
        })
