"""
Seed script for Umoja Skills platform.

Usage:
  cd backend && source .venv/bin/activate
  python scripts/seed.py

Creates:
  - 6 service categories
  - 1 test client account  (client@umoja.test / testpass123)
  - 3 test provider accounts with profiles and services
  - Sample bookings + reviews to populate the dashboards
"""

import os
import sys
import django

# ── Bootstrap Django ──────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from users.models import User, ProviderProfile
from services.models import ServiceCategory, ServiceListing
from bookings.models import Booking
from reviews.models import Review

# ── Categories ────────────────────────────────────────────────────────────────
print('→ Seeding categories...')
CATS = [
    ('Plumbing',     'plumbing',     'wrench'),
    ('Electrical',   'electrical',   'zap'),
    ('Tailoring',    'tailoring',    'scissors'),
    ('Hairdressing', 'hairdressing', 'sparkles'),
    ('Mechanic',     'mechanic',     'settings'),
    ('Tutoring',     'tutoring',     'book-open'),
]
cats = {}
for name, slug, icon in CATS:
    obj, created = ServiceCategory.objects.get_or_create(
        slug=slug,
        defaults={'name': name, 'icon': icon},
    )
    cats[slug] = obj
    print(f'   {"Created" if created else "Exists "} category: {name}')

# ── Test Client ───────────────────────────────────────────────────────────────
print('\n→ Seeding test client...')
client, created = User.objects.get_or_create(
    email='client@umoja.test',
    defaults={
        'first_name': 'Jane',
        'last_name': 'Njeri',
        'role': 'CLIENT',
        'location': 'Umoja Phase 1',
        'phone': '+254711234567',
        'is_active': True,
        'is_verified': True,
    },
)
client.set_password('testpass123')
client.save()
print(f'   {"Created" if created else "Exists "} client: {client.email}')

# ── Test Providers ────────────────────────────────────────────────────────────
print('\n→ Seeding providers...')

PROVIDERS = [
    {
        'email': 'provider@umoja.test',
        'first_name': 'John',
        'last_name': 'Kamau',
        'phone': '+254722345678',
        'location': 'Umoja Innercore',
        'bio': 'Professional plumber with 7+ years serving Umoja and Kayole estates. Available 24/7 for emergencies.',
        'years_experience': 7,
        'services': [
            {
                'category': 'plumbing',
                'title': 'Pipe Installation & Repair',
                'description': 'Full pipe installation, leak repair, and plumbing maintenance. Same-day service available.',
                'price_kes': 2500,
                'area': 'Umoja Innercore',
            },
            {
                'category': 'plumbing',
                'title': 'Water Tank Cleaning',
                'description': 'Professional water tank cleaning using eco-friendly disinfectants. Includes roof and underground tanks.',
                'price_kes': 3500,
                'area': 'Umoja Phase 1',
            },
        ],
    },
    {
        'email': 'electric@umoja.test',
        'first_name': 'Mary',
        'last_name': 'Wanjiku',
        'phone': '+254733456789',
        'location': 'Umoja Phase 2',
        'bio': 'Licensed electrician specialising in domestic wiring, solar installations, and appliance repair.',
        'years_experience': 5,
        'services': [
            {
                'category': 'electrical',
                'title': 'House Wiring & Rewiring',
                'description': 'Complete domestic wiring for new constructions and rewiring of old installations. KEBS compliant.',
                'price_kes': 5000,
                'area': 'Umoja Phase 2',
            },
            {
                'category': 'electrical',
                'title': 'Solar Panel Installation',
                'description': 'Install solar panels and inverters for homes and SMEs. Includes free site survey.',
                'price_kes': 45000,
                'area': 'Umoja & Kayole',
            },
        ],
    },
    {
        'email': 'tailor@umoja.test',
        'first_name': 'Samuel',
        'last_name': 'Otieno',
        'phone': '+254744567890',
        'location': 'Umoja Market',
        'bio': 'Expert tailor creating custom African and Western garments. School uniforms, suits, and dresses.',
        'years_experience': 10,
        'services': [
            {
                'category': 'tailoring',
                'title': 'Custom Suit & Formal Wear',
                'description': 'Hand-tailored suits, blazers, and formal wear for weddings, interviews, and events.',
                'price_kes': 8000,
                'area': 'Umoja Market',
            },
            {
                'category': 'tailoring',
                'title': 'School Uniform Stitching',
                'description': 'Quality school uniforms at affordable prices. Bulk orders for institutions welcome.',
                'price_kes': 1200,
                'area': 'Umoja',
            },
        ],
    },
]

providers = []
for pdata in PROVIDERS:
    user, created = User.objects.get_or_create(
        email=pdata['email'],
        defaults={
            'first_name': pdata['first_name'],
            'last_name': pdata['last_name'],
            'role': 'PROVIDER',
            'location': pdata['location'],
            'phone': pdata['phone'],
            'is_active': True,
            'is_verified': True,
        },
    )
    user.set_password('testpass123')
    user.save()
    print(f'   {"Created" if created else "Exists "} provider: {user.email}')

    profile, _ = ProviderProfile.objects.get_or_create(
        user=user,
        defaults={
            'bio': pdata['bio'],
            'is_available': True,
            'years_experience': pdata['years_experience'],
        },
    )

    for sdata in pdata['services']:
        listing, s_created = ServiceListing.objects.get_or_create(
            provider=user,
            title=sdata['title'],
            defaults={
                'category': cats[sdata['category']],
                'description': sdata['description'],
                'price_kes': sdata['price_kes'],
                'service_area': sdata['area'],
            },
        )
        print(f'     {"Created" if s_created else "Exists "} service: {listing.title}')

    providers.append(user)

# ── Sample Bookings + Reviews ─────────────────────────────────────────────────
print('\n→ Seeding bookings & reviews...')

plumber = User.objects.get(email='provider@umoja.test')
plumber_service = ServiceListing.objects.filter(
    provider=plumber, title='Pipe Installation & Repair'
).first()

if plumber_service:
    # Completed booking with review
    booking, created = Booking.objects.get_or_create(
        client=client,
        service=plumber_service,
        defaults={
            'scheduled_at': timezone.now() - timedelta(days=5),
            'notes': 'Please come in the morning.',
            'status': 'COMPLETED',
        },
    )
    print(f'   {"Created" if created else "Exists "} booking: {booking.id}')

    if created:
        review = Review.objects.create(
            booking=booking,
            reviewer=client,
            reviewee=plumber,
            rating=5,
            comment='Excellent work! Fixed the leak very fast and cleaned up after himself.',
        )
        print(f'   Created review: {review.id}')

        # Update provider cached rating
        profile = plumber.provider_profile
        reviews = Review.objects.filter(reviewee=plumber)
        profile.cached_rating = sum(r.rating for r in reviews) / reviews.count()
        profile.cached_review_count = reviews.count()
        profile.save()
        print(f'   Updated cached rating: {profile.cached_rating}')

    # Pending booking (upcoming)
    Booking.objects.get_or_create(
        client=client,
        service=plumber_service,
        scheduled_at=timezone.now() + timedelta(days=2),
        defaults={
            'notes': 'Tank cleaning next week.',
            'status': 'PENDING',
        },
    )

# ── Summary ───────────────────────────────────────────────────────────────────
print('\n✅ Seed complete!')
print(f'   Categories:  {ServiceCategory.objects.count()}')
print(f'   Providers:   {User.objects.filter(role="PROVIDER").count()}')
print(f'   Clients:     {User.objects.filter(role="CLIENT").count()}')
print(f'   Services:    {ServiceListing.objects.count()}')
print(f'   Bookings:    {Booking.objects.count()}')
print(f'   Reviews:     {Review.objects.count()}')
print()
print('   Test credentials:')
print('   client@umoja.test  / testpass123')
print('   provider@umoja.test / testpass123')
print('   electric@umoja.test / testpass123')
print('   tailor@umoja.test  / testpass123')
