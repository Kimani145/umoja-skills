# Umoja Skills

**A platform connecting clients with trusted local service providers in Kenya.**

[![Backend](https://img.shields.io/badge/Backend-Django%204.2%20%2B%20DRF-092E20?logo=django)](https://www.djangoproject.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react)](https://reactjs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Deploy](https://img.shields.io/badge/API-Render-46E3B7?logo=render)](https://render.com/)
[![Deploy](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel)](https://vercel.com/)

---

## What is Umoja Skills?

Umoja Skills is a marketplace that makes it easy for Kenyans to find and book vetted local service providers — from plumbers and electricians to tutors and cleaners. Providers list their services, set their availability, and get booked directly by clients. Both parties communicate through a built-in messaging system.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│              React 18 + Vite + TypeScript (Vercel)           │
└────────────────────────────┬─────────────────────────────────┘
                             │ REST API (JWT)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│              Django 4.2 + DRF Backend (Render)               │
│   users · services · bookings · reviews · messaging          │
└────────────────────────────┬─────────────────────────────────┘
                             │ psycopg2 (service role)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│         Supabase PostgreSQL (eu-central-1)                   │
│         RLS enabled · Pooler connection                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
umoja-skills/
├── backend/          # Django REST API
│   ├── core/         # Settings, URLs, WSGI
│   ├── users/        # Auth, profiles, KYC verification
│   ├── services/     # Service listings & categories
│   ├── bookings/     # Booking lifecycle management
│   ├── reviews/      # Ratings & reviews
│   ├── messaging/    # Conversations & messages
│   ├── .env.example  # Environment variable template
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # React + Vite SPA
│   ├── src/
│   │   ├── api/      # Axios API modules
│   │   ├── pages/    # Route-level page components
│   │   ├── components/
│   │   ├── store/    # Zustand state management
│   │   ├── router/   # React Router config
│   │   └── types/
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
├── render.yaml
└── setup.sh
```

---

## Quick Start (Local)

### Prerequisites
- Python 3.12+
- Node.js 18+
- A Supabase project (or local PostgreSQL)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL and SECRET_KEY

python manage.py migrate
python manage.py createsuperuser
gunicorn core.wsgi:application --bind 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env — set VITE_API_URL and VITE_SUPABASE_URL

npm run dev
```

App available at: **http://localhost:5173**  
Backend API at: **http://localhost:8000**  
Admin panel at: **http://localhost:8000/umoja-mgmt/**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | Django secret key (50+ random chars) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DEBUG` | ✅ | `True` for dev, `False` for prod |
| `ALLOWED_HOSTS` | ✅ | Comma-separated allowed hostnames |
| `FRONTEND_URL` | ✅ | Used in password reset email links |
| `REDIS_URL` | optional | Celery broker (defaults to localhost) |
| `EMAIL_HOST_USER` | optional | SMTP sender email |
| `EMAIL_HOST_PASSWORD` | optional | SMTP password |
| `SUPABASE_S3_KEY_ID` | optional | Media uploads in production |
| `SUPABASE_S3_SECRET` | optional | Media uploads in production |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/publishable key |

> ⚠️ **Never commit `.env` files.** Use `.env.example` as the template.

---

## Deployment

### Backend — Render
The backend deploys automatically via `render.yaml`. Set all production env vars in the Render dashboard:
- `SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"`
- `DATABASE_URL` — Supabase pooler connection string
- `DEBUG=False`
- `ALLOWED_HOSTS` — your Render hostname
- `FRONTEND_URL` — your Vercel deployment URL

### Frontend — Vercel
Set in Vercel project settings:
- `VITE_API_URL` — your Render backend URL
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Key Features

| Feature | Details |
|---|---|
| **Dual-role auth** | Clients and Service Providers with role-based routing |
| **JWT authentication** | 30-min access tokens, 7-day refresh with rotation |
| **KYC verification** | Providers submit National ID / Passport for admin review |
| **Service listings** | Categories, photos, pricing, service area |
| **Bookings** | PENDING → CONFIRMED → COMPLETED lifecycle |
| **Reviews** | One review per completed booking |
| **Messaging** | Real-time conversation threads |
| **Password reset** | Secure single-use token, 1-hour expiry |
| **Admin panel** | Django admin at `/umoja-mgmt/` |

---

## User Roles

| Role | Can Do |
|---|---|
| **CLIENT** | Browse services, book providers, message, review, save favourites |
| **PROVIDER** | List services, manage bookings, view earnings, message clients |
| **Admin (superuser)** | Full Django admin access — approve/reject KYC, manage all data |

---

## Security Notes

- All 15 public Supabase tables have **RLS enabled** — direct PostgREST access is blocked
- Passwords are hashed using Django's **PBKDF2-SHA256**
- JWT access tokens expire in **30 minutes** with rotation on refresh
- CORS is locked to `FRONTEND_URL` in production
- Admin panel URL is non-default (`/umoja-mgmt/`)

---

## Links

- **Live API:** https://umoja-skills.onrender.com
- **Frontend:** https://umoja-skills.vercel.app *(update this)*
- **Admin:** https://umoja-skills.onrender.com/umoja-mgmt/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/smfurojgloigggjykmql
