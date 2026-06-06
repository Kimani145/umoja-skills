from rest_framework import serializers
from .models import Booking
from services.models import ServiceListing
from services.serializers import ServiceListingSerializer
from users.serializers import UserSerializer


class BookingSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    service = ServiceListingSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceListing.objects.filter(is_active=True),
        write_only=True,
        source='service',
    )
    has_review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id', 'client', 'service', 'service_id',
            'scheduled_at', 'notes', 'status',
            'has_review',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'client', 'has_review', 'created_at', 'updated_at')

    def get_has_review(self, obj):
        """Returns True if this booking already has a review submitted."""
        return hasattr(obj, 'review')

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ('status',)
