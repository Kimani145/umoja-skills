# Backend Documentation

**Django 4.2 + DRF REST API for Umoja Skills**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Django 4.2 |
| API | Django REST Framework 3.14 |
| Auth | JWT via `djangorestframework-simplejwt` |
| Database | PostgreSQL (Supabase) via `psycopg2-binary` |
| Static Files | WhiteNoise |
| Deployment | Gunicorn on Render |

---

## Project Layout

```
backend/
├── core/          # Settings, root URLs, WSGI
├── users/         # Auth, profiles, KYC, dashboards
├── services/      # ServiceCategory, ServiceListing
├── bookings/      # Booking lifecycle
├── reviews/       # Ratings and reviews
├── messaging/     # Conversations and messages
├── .env.example   # Template — copy to .env
└── requirements.txt
```

---

## API Endpoints

**Base URL:** `http://localhost:8000/api/` (local) | `https://umoja-skills.onrender.com/api/` (prod)

All protected endpoints require: `Authorization: Bearer <access_token>`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | — | Register new user, returns JWT pair |
| POST | `/api/auth/login/` | — | Login, returns JWT pair |
| GET | `/api/auth/me/` | ✅ | Get own profile |
| PATCH | `/api/auth/me/` | ✅ | Update own profile |
| POST | `/api/auth/verify-profile/` | ✅ | Submit KYC document (stays PENDING) |
| POST | `/api/auth/password-reset/` | — | Send reset email |
| POST | `/api/auth/password-reset/confirm/` | — | Set new password via token |
| POST | `/api/auth/token/refresh/` | — | Refresh access token |

#### Register body
```json
{
  "email": "jane@example.com",
  "password": "Password1",
  "first_name": "Jane",
  "last_name": "Doe",
  "role": "CLIENT",
  "phone": "+254712345678",
  "location": "Nairobi"
}
```

#### Password rules
- Minimum 8 characters, ≥1 uppercase, ≥1 number
- Django's CommonPassword and NumericPassword validators also active

### Services

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories/` | List all service categories |
| GET | `/api/services/` | List/search listings (`?search=plumber&location=Nairobi`) |
| POST | `/api/services/` | Create listing (PROVIDER only) |
| GET/PUT/DELETE | `/api/services/{id}/` | Detail / update / delete |
| GET | `/api/providers/{uuid}/profile/` | Provider public profile |

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/bookings/` | List current user's bookings |
| POST | `/api/bookings/` | Create booking (CLIENT only) |
| GET/PATCH | `/api/bookings/{id}/` | Detail / update status |

Status lifecycle: `PENDING → CONFIRMED → COMPLETED` (or `CANCELLED`)

### Reviews

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reviews/` | List reviews (`?reviewee=uuid`) |
| POST | `/api/reviews/create/` | Review a completed booking (1 per booking) |

### Messaging

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/conversations/` | List / start conversations |
| GET/POST | `/api/conversations/{id}/messages/` | Read / send messages |
| POST | `/api/conversations/{id}/typing/` | Typing indicator |

### Dashboard & Other

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/client/` | Client stats, recent activity |
| GET | `/api/dashboard/provider/` | Provider stats, upcoming bookings |
| GET | `/api/earnings/` | PROVIDER: per-job + monthly breakdown |
| GET/POST/DELETE | `/api/saved/` | CLIENT: manage saved listings |
| GET | `/api/health/` | `{"status": "ok"}` |

---

## Data Models

### User
```
id UUID PK | email UNIQUE | first_name | last_name | phone
role CLIENT|PROVIDER | avatar | location | is_verified bool
is_staff | is_superuser | created_at | updated_at
USERNAME_FIELD = 'email' (no username field)
```

### ServiceListing
```
id UUID PK | provider FK→User | category FK→ServiceCategory
title | description | price_kes decimal | service_area
photos jsonb | is_active bool
```

### Booking
```
id UUID PK | client FK→User | service FK→ServiceListing (PROTECT)
scheduled_at | notes | status PENDING|CONFIRMED|COMPLETED|CANCELLED
Indexes: (client,status), (service,status), (-scheduled_at)
```

### Review
```
id UUID PK | booking FK UNIQUE | reviewer FK→User | reviewee FK→User
rating 0-5 | comment text
```

### VerificationRequest
```
id UUID PK | user FK | document_type NATIONAL_ID|PASSPORT|BUSINESS_PERMIT
document_number | document_image | status PENDING|APPROVED|REJECTED
rejection_reason
```

### PasswordResetToken
```
user FK | token varchar UNIQUE (48-byte urlsafe random)
created_at | used bool — expires 1 hour after creation
```

---

## Authentication Details

### JWT Settings
```
ACCESS_TOKEN_LIFETIME  = 30 minutes
REFRESH_TOKEN_LIFETIME = 7 days
ROTATE_REFRESH_TOKENS  = True   ← new token on every refresh
BLACKLIST_AFTER_ROTATION = True ← old tokens invalidated
```

### Duplicate Account Prevention
1. **DB level:** `UNIQUE` constraint on `email`
2. **Serializer level:** `validate_email()` checks existence first, returns clear error

### Password Reset Flow
1. POST to `/password-reset/` — always 200 (anti-enumeration)
2. If email found → token created, old tokens revoked, email sent
3. POST to `/password-reset/confirm/` with `{token, password}` → sets new password

### KYC Verification
- User submits document → status = **PENDING**
- Admin reviews at `/umoja-mgmt/` → approves or rejects
- On approval: `user.is_verified = True`

---

## Admin Panel

**URL:** `/umoja-mgmt/` (not `/admin/` — intentionally obscured)

Registered:
- **User** — filter by role/verified; search by email/phone/location
- **VerificationRequest** — bulk Approve / Reject actions
- **ServiceListing, Booking, Review** — full CRUD

---

## Running Locally

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # fill in SECRET_KEY + DATABASE_URL
python manage.py migrate
python manage.py createsuperuser
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 2
```

---

## Environment Variables

| Variable | Required | Default |
|---|---|---|
| `SECRET_KEY` | ✅ | raises ValueError if missing |
| `DATABASE_URL` | ✅ | — |
| `DEBUG` | ✅ | `False` |
| `ALLOWED_HOSTS` | ✅ | `localhost,127.0.0.1` |
| `FRONTEND_URL` | ✅ | `http://localhost:5173` |
| `REDIS_URL` | optional | `redis://localhost:6379/0` |
| `EMAIL_HOST_USER/PASSWORD` | optional | console backend in dev |
| `SUPABASE_S3_KEY_ID/SECRET` | optional | local disk in dev |

---

## Supabase Database

- **Project:** `umoja_skills` (region: eu-central-1)
- **Connection:** via Supabase pooler (port 5432, IPv4)
- **RLS:** Enabled on all 15 public tables — direct PostgREST access is blocked
- Django connects using the **service role** (bypasses RLS) via `DATABASE_URL`
- Supabase auth schema is **not used** — Django manages its own auth

### Public Tables

| Table | Purpose | RLS |
|---|---|---|
| `users_user` | All user accounts | ✅ |
| `users_providerprofile` | Provider-specific data | ✅ |
| `users_verificationrequest` | KYC submissions | ✅ |
| `users_passwordresettoken` | Reset tokens | ✅ |
| `users_savedprovider` | Bookmarked services | ✅ |
| `services_servicecategory` | Service categories | ✅ |
| `services_servicelisting` | Service listings | ✅ |
| `bookings_booking` | Booking records | ✅ |
| `reviews_review` | Reviews | ✅ |
| `messaging_conversation` | Chat threads | ✅ |
| `messaging_message` | Messages | ✅ |
| `messaging_conversation_participants` | Thread members | ✅ |
| `django_session` | Sessions | ✅ |
| `django_migrations` | Migration history | ✅ |
| `django_admin_log` | Admin audit trail | ✅ |
