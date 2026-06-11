import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, VerificationRequest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Kenyan phone number patterns:  +2547XXXXXXXX | 07XXXXXXXX | 2547XXXXXXXX
_PHONE_RE = re.compile(
    r'^(?:\+254|254|0)(7[0-9]{8}|1[0-9]{8})$'
)

def _is_sequential(digits: str) -> bool:
    """Detect sequential runs like 123456789 or 987654321."""
    if len(digits) < 7:
        return False
    up = down = 0
    for i in range(1, len(digits)):
        if int(digits[i]) == int(digits[i - 1]) + 1:
            up += 1
        if int(digits[i]) == int(digits[i - 1]) - 1:
            down += 1
    return up >= 6 or down >= 6


def _is_repeated(digits: str) -> bool:
    """Detect all-same or near-all-same digits like 111111111."""
    return len(set(digits)) <= 2


def validate_kenyan_phone(value: str) -> str:
    """
    Validates a Kenyan phone number and returns a normalised +254XXXXXXXXX form.
    Raises serializers.ValidationError on failure.
    """
    if not value:
        return value  # optional field

    clean = value.strip().replace(' ', '').replace('-', '')
    if not _PHONE_RE.match(clean):
        raise serializers.ValidationError(
            'Enter a valid Kenyan number — e.g. +254712345678 or 0712345678.'
        )

    # Use the last 9 significant digits for pattern checks
    digits_only = re.sub(r'\D', '', clean)
    local = digits_only[-9:]

    if _is_sequential(local):
        raise serializers.ValidationError(
            'Phone number looks invalid — sequential digits are not allowed.'
        )
    if _is_repeated(local):
        raise serializers.ValidationError(
            'Phone number looks invalid — please enter a real number.'
        )

    # Normalise to +254XXXXXXXXX
    if clean.startswith('0'):
        return '+254' + clean[1:]
    if clean.startswith('254'):
        return '+' + clean
    return clean  # already starts with +254


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'phone', 'role', 'avatar', 'location', 'is_verified',
        )
        read_only_fields = ('id', 'is_verified')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    location = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'role', 'phone', 'location')

    # ── Field-level validators ────────────────────────────────────────────

    def validate_email(self, value: str) -> str:
        value = value.strip().lower()
        try:
            validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError('Enter a valid email address.')
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_password(self, value: str) -> str:
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError('Password must contain at least one number.')
        return value

    def validate_phone(self, value: str) -> str:
        return validate_kenyan_phone(value)

    def validate_first_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError('First name is required.')
        if not re.match(r"^[A-Za-z'\- ]+$", value):
            raise serializers.ValidationError('First name may only contain letters, hyphens, and apostrophes.')
        return value

    def validate_last_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Last name is required.')
        if not re.match(r"^[A-Za-z'\- ]+$", value):
            raise serializers.ValidationError('Last name may only contain letters, hyphens, and apostrophes.')
        return value

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data: dict) -> dict:
        user = authenticate(username=data['email'].strip().lower(), password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data


class VerificationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationRequest
        fields = ('id', 'document_type', 'document_number', 'document_image', 'status', 'created_at')
        read_only_fields = ('id', 'status', 'created_at')

