"""
Django signals for Review model to auto-update ProviderProfile cache.
This avoids expensive AVG(rating) queries on every provider list.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Review


def _refresh_provider_cache(provider_user):
    """Recalculate and cache provider's rating and review count."""
    from users.models import ProviderProfile
    
    # Compute aggregates from all reviews for this provider
    agg = Review.objects.filter(reviewee=provider_user).aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id')
    )
    
    # Update or create provider profile with cached values
    profile, created = ProviderProfile.objects.get_or_create(user=provider_user)
    profile.cached_rating = agg['avg_rating'] or 0.00
    profile.cached_review_count = agg['total_reviews'] or 0
    profile.save(update_fields=['cached_rating', 'cached_review_count'])


@receiver(post_save, sender=Review)
def on_review_created_or_updated(sender, instance, created, **kwargs):
    """Refresh cache when a review is created or updated."""
    _refresh_provider_cache(instance.reviewee)


@receiver(post_delete, sender=Review)
def on_review_deleted(sender, instance, **kwargs):
    """Refresh cache when a review is deleted."""
    _refresh_provider_cache(instance.reviewee)
