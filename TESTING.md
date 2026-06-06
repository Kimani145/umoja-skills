# Umoja Backend Testing Guide

## Quick Start

### 1. Local Development Setup
```bash
cd backend
export $(cat ../.env.local | xargs)
python manage.py runserver 8000
```

### 2. API Testing
```bash
# List services
curl http://localhost:8000/api/services/

# Login (get JWT tokens)
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"client@umoja.test","password":"testpass123"}'

# Create booking (with token)
curl -X POST http://localhost:8000/api/bookings/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"service_id":"<SERVICE_ID>","scheduled_at":"2026-05-31T14:00:00Z"}'
```

### 3. Test Credentials
- **Admin:** admin@umoja.test / admin123
- **Client:** client@umoja.test / testpass123
- **Provider:** provider@umoja.test / testpass123

### 4. Admin Panel
- URL: http://localhost:8000/admin/
- Models available: User, ProviderProfile, ServiceListing, Booking, Review, Conversation, Message

---

## Schema Verification

```bash
python manage.py shell

# Check ProviderProfile cache
from users.models import ProviderProfile
profile = ProviderProfile.objects.get(user__email='provider@umoja.test')
print(f"Rating: {profile.cached_rating}, Count: {profile.cached_review_count}")

# Verify signals work
from reviews.models import Review
Review.objects.create(
    booking=<booking>,
    reviewer=<client>,
    reviewee=<provider>,
    rating=5
)
# Cache should auto-update ✓
```

---

## Index Verification

```bash
# In Django shell:
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
for idx_name, in cursor.fetchall():
    print(idx_name)
```

Expected indexes:
- idx_provider_active
- idx_category_active
- idx_area_active
- idx_created_desc
- idx_client_status
- idx_service_status
- idx_scheduled_desc
- idx_conversation_created
- idx_conversation_unread
- idx_reviewee_created

---

## Database State

```
Users: 3
├─ admin@umoja.test (superuser)
├─ client@umoja.test (CLIENT role)
└─ provider@umoja.test (PROVIDER role + ProviderProfile)

ServiceCategory: 8
└─ Plumbing, Electrical, Tailoring, Hairdressing, Mechanic, Tutoring, Construction, Beauty

ServiceListing: 2
├─ Pipe Installation & Repair
└─ Drain Clearing

Booking: 1
└─ client → Drain Clearing (status: CONFIRMED)

Review: 1
└─ client rating provider 5⭐ (cached on ProviderProfile)
```

---

## Files Changed

✅ **Models:** users/, services/, bookings/, reviews/, messaging/
✅ **Migrations:** All apps (auto-generated from models)
✅ **Signals:** reviews/signals.py (NEW)
✅ **Seed Script:** scripts/seed.py (no username)
✅ **Config:** .env.local (local SQLite DB)

---

## Next Steps

1. **Run full docker-compose** when ready
2. **Point to Supabase PostgreSQL** (swap DATABASE_URL in .env)
3. **Implement component pages** (currently stubs in frontend/)
4. **Add image uploads** (AWS S3 or Supabase Storage)
5. **WebSocket messaging** (upgrade from polling with Django Channels)

