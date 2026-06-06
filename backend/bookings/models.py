import uuid
from django.db import models
from users.models import User
from services.models import ServiceListing

class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings_as_client')
    service = models.ForeignKey(ServiceListing, on_delete=models.PROTECT, related_name='bookings')
    scheduled_at = models.DateTimeField(db_index=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status'], name='idx_client_status'),
            models.Index(fields=['service', 'status'], name='idx_service_status'),
            models.Index(fields=['-scheduled_at'], name='idx_scheduled_desc'),
        ]
    
    def __str__(self):
        return f"Booking {self.id} - {self.client.email} x {self.service.title}"
