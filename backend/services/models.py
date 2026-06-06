import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User

class ServiceCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Service Category'
        verbose_name_plural = 'Service Categories'
    
    def __str__(self):
        return self.name


class ServiceListing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='services', limit_choices_to={'role': 'PROVIDER'})
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name='listings')
    title = models.CharField(max_length=200)
    description = models.TextField()
    price_kes = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    service_area = models.CharField(max_length=100)
    photos = models.JSONField(default=list)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['provider', 'is_active'], name='idx_provider_active'),
            models.Index(fields=['category', 'is_active'], name='idx_category_active'),
            models.Index(fields=['service_area', 'is_active'], name='idx_area_active'),
            models.Index(fields=['-created_at'], name='idx_created_desc'),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.provider.email}"
    
    @property
    def average_rating(self):
        from reviews.models import Review
        reviews = Review.objects.filter(booking__service=self)
        if not reviews.exists():
            return 0
        return sum(r.rating for r in reviews) / reviews.count()
    
    @property
    def total_reviews(self):
        from reviews.models import Review
        return Review.objects.filter(booking__service=self).count()
