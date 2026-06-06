from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Booking
from .serializers import BookingSerializer, BookingStatusUpdateSerializer
from reviews.models import Review


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CLIENT':
            return Booking.objects.filter(client=user)
        elif user.role == 'PROVIDER':
            return Booking.objects.filter(service__provider=user)
        return Booking.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'CLIENT':
            return Response({'error': 'Only clients can create bookings'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        serializer = BookingStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        user = request.user

        if new_status == 'CONFIRMED':
            if user.role != 'PROVIDER' or booking.service.provider != user:
                return Response({'error': 'Only provider can confirm booking'}, status=status.HTTP_403_FORBIDDEN)
        elif new_status == 'COMPLETED':
            if user.role != 'PROVIDER' or booking.service.provider != user:
                return Response({'error': 'Only provider can complete booking'}, status=status.HTTP_403_FORBIDDEN)
        elif new_status == 'CANCELLED':
            if user.role == 'CLIENT' and booking.status != 'PENDING':
                return Response({'error': 'Can only cancel pending bookings'}, status=status.HTTP_400_BAD_REQUEST)
            if user.role != 'CLIENT' and user != booking.service.provider:
                return Response({'error': 'Cannot cancel this booking'}, status=status.HTTP_403_FORBIDDEN)

        booking.status = new_status
        booking.save()
        
        return Response(BookingSerializer(booking).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def upcoming(self, request):
        from django.utils import timezone
        from datetime import timedelta
        
        queryset = self.get_queryset().filter(
            scheduled_at__gte=timezone.now(),
            status__in=['PENDING', 'CONFIRMED']
        ).order_by('scheduled_at')[:5]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
