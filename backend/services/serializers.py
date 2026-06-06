from rest_framework import serializers
from .models import ServiceCategory, ServiceListing
from users.serializers import UserSerializer


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ('id', 'name', 'icon', 'slug', 'created_at')


class ServiceListingSerializer(serializers.ModelSerializer):
    provider = UserSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(),
        write_only=True,
        source='category',
    )
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()

    class Meta:
        model = ServiceListing
        fields = (
            'id', 'provider', 'category', 'category_id',
            'title', 'description', 'price_kes', 'service_area',
            'photos', 'is_active',
            'average_rating', 'total_reviews',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'provider', 'created_at', 'updated_at')

    def get_average_rating(self, obj):
        """Read from cached provider profile rating."""
        profile = getattr(obj.provider, 'provider_profile', None)
        if profile:
            return float(profile.cached_rating)
        # Fallback: compute from reviews on this specific service
        from reviews.models import Review
        reviews = Review.objects.filter(booking__service=obj)
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 2)
        return 0

    def get_total_reviews(self, obj):
        """Read from cached provider profile review count."""
        profile = getattr(obj.provider, 'provider_profile', None)
        if profile:
            return profile.cached_review_count
        from reviews.models import Review
        return Review.objects.filter(booking__service=obj).count()

    def create(self, validated_data):
        validated_data['provider'] = self.context['request'].user
        return super().create(validated_data)
