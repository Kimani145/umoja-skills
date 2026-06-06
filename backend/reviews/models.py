import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from bookings.models import Booking

class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        db_index=True
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['booking'], name='unique_review_per_booking')
        ]
        indexes = [
            models.Index(fields=['reviewee', '-created_at'], name='idx_reviewee_created'),
        ]
    
    def __str__(self):
        return f"Review by {self.reviewer.email} - {self.rating}★"
