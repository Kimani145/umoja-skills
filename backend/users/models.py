import uuid
import secrets
from django.utils import timezone
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email field is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = (
        ('CLIENT', 'Client'),
        ('PROVIDER', 'Service Provider'),
    )
    
    username = None  # Remove username field
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CLIENT', db_index=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class ProviderProfile(models.Model):
    """Optional provider-specific profile extension."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    bio = models.TextField(blank=True, help_text="Professional bio / about provider")
    is_available = models.BooleanField(default=True)
    years_experience = models.PositiveSmallIntegerField(default=0)
    
    # Cached aggregates — updated by signals to avoid expensive COUNT/AVG on every query
    cached_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.00,
        help_text="Average rating (cached, updated by review signals)"
    )
    cached_review_count = models.PositiveIntegerField(
        default=0,
        help_text="Total review count (cached, updated by review signals)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Provider Profile'
        verbose_name_plural = 'Provider Profiles'
    
    def __str__(self):
        return f"{self.user.email} - Provider"


class SavedProvider(models.Model):
    """Bookmarked service listings for CLIENT users."""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='saved_providers'
    )
    service = models.ForeignKey(
        'services.ServiceListing', on_delete=models.CASCADE,
        related_name='saved_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'service']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} → {self.service.title}"


class PasswordResetToken(models.Model):
    """Single-use password reset token, expires after 1 hour."""
    user  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def create_for_user(cls, user):
        """Invalidate any existing tokens for the user, generate a new one."""
        cls.objects.filter(user=user, used=False).update(used=True)
        token = secrets.token_urlsafe(48)
        return cls.objects.create(user=user, token=token)

    def is_valid(self):
        """Token must be unused and less than 1 hour old."""
        return (
            not self.used and
            self.created_at >= timezone.now() - timedelta(hours=1)
        )

    def __str__(self):
        return f"Reset token for {self.user.email} (used={self.used})"
