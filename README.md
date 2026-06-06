# Umoja Community Skills Directory

Two-sided marketplace for service discovery in Nairobi.

## Dense Quickstart (backend-first)

1) Backend (Linux / macOS)

```bash
cd backend
python -m venv .venv            # optional but recommended
source .venv/bin/activate
pip install -r requirements.txt
# copy or set env vars (DATABASE_URL, SECRET_KEY, DEBUG, etc.)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

Notes: see [backend/requirements.txt](backend/requirements.txt) for pinned deps. The project expects PostgreSQL (or set `DATABASE_URL`) and uses Django 4.2 + DRF.

2) Frontend

```bash
cd frontend
npm ci
npm run dev
```

3) Docker (optional)

```bash
docker-compose up --build
```

## Troubleshooting & tips

- Create and activate a virtual environment before `pip install` to avoid system-wide installs.
- If migrations fail, confirm `DATABASE_URL` and database accessibility; run `python manage.py makemigrations` when adding models.
- To seed sample data run `python backend/scripts/seed.py` if needed.

## Project Structure

- [backend](backend) — Django backend (API, auth, services, bookings, messaging)
- [frontend](frontend) — React + TypeScript + Vite UI

If you want I can also: add a minimal `.env.example`, or pin/update `backend/requirements.txt` versions. 
