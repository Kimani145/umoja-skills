from rest_framework import serializers
from .models import Review
from bookings.models import Booking
from users.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewee = UserSerializer(read_only=True)

    # Frontend sends booking_id (UUID string), not the full booking object
    booking_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Review
        fields = (
            'id', 'booking', 'booking_id',
            'reviewer', 'reviewee',
            'rating', 'comment',
            'created_at',
        )
        read_only_fields = ('id', 'booking', 'reviewer', 'reviewee', 'created_at')

    def validate(self, data):
        request = self.context.get('request')
        booking_id = data.pop('booking_id', None)

        if not booking_id:
            raise serializers.ValidationError({'booking_id': 'This field is required.'})

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            raise serializers.ValidationError({'booking_id': 'Booking not found.'})

        if request and booking.client != request.user:
            raise serializers.ValidationError({'booking_id': 'Not your booking.'})

        if booking.status != 'COMPLETED':
            raise serializers.ValidationError({'booking_id': 'Can only review completed bookings.'})

        if Review.objects.filter(booking=booking).exists():
            raise serializers.ValidationError({'booking_id': 'Review already submitted for this booking.'})

        data['booking'] = booking
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['reviewer'] = request.user
        validated_data['reviewee'] = validated_data['booking'].service.provider
        return super().create(validated_data)
