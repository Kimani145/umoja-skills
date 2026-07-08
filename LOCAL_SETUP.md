# Local Development Setup for Umoja Skills

## Prerequisites

- **Python 3.11+** — https://www.python.org/downloads/
- **Node.js 18+** — https://nodejs.org/
- **PostgreSQL 15** (or use Docker) — https://www.postgresql.org/download/
- **Git** — https://git-scm.com/downloads
- **Docker** (optional, for easy database setup) — https://www.docker.com/products/docker-desktop

---

## Option 1: Quick Setup with Docker (Recommended)

### Step 1: Clone the repo
```bash
git clone https://github.com/Kimani145/umoja-skills.git
cd umoja-skills
```

### Step 2: Copy environment files
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Step 3: Start everything with Docker
```bash
docker-compose up
```

This automatically starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **Django backend** on `http://localhost:8000`
- **React frontend** on `http://localhost:5173`

### Step 4: Access the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Admin panel: http://localhost:8000/umoja-mgmt/

---

## Option 2: Manual Setup (Without Docker)

### Backend Setup

#### Step 1: Clone the repo
```bash
git clone https://github.com/Kimani145/umoja-skills.git
cd umoja-skills/backend
```

#### Step 2: Create Python virtual environment
```bash
python -m venv .venv
```

**Activate venv:**
- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (CMD):**
  ```cmd
  .venv\Scripts\activate.bat
  ```
- **macOS/Linux:**
  ```bash
  source .venv/bin/activate
  ```

#### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Configure environment
```bash
cp .env.example .env
```

Edit `.env` and set:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/umoja
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

#### Step 5: Create database
```bash
# If you have PostgreSQL running locally, create the database
createdb -U postgres umoja
```

Or use the included `docker-compose.yml` just for the database:
```bash
# From project root
docker-compose up db redis -d
```

#### Step 6: Run migrations
```bash
python manage.py migrate
```

#### Step 7: Create superuser (admin)
```bash
python manage.py createsuperuser
# Follow the prompts to create admin account
```

#### Step 8: Run backend server
```bash
python manage.py runserver 0.0.0.0:8000
```

Backend is now at: http://localhost:8000/api/

---

### Frontend Setup

#### Step 1: Navigate to frontend
```bash
cd ../frontend
```

#### Step 2: Install Node dependencies
```bash
npm install
```

#### Step 3: Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_API_URL=http://localhost:8000/api
```

#### Step 4: Run development server
```bash
npm run dev
```

Frontend is now at: http://localhost:5173

---

## Troubleshooting

### Python not found
```bash
# Use Python 3 explicitly
python3 -m venv .venv
python3 -m pip install -r requirements.txt
```

### PostgreSQL connection error
```bash
# Option 1: Use Docker for database only
docker run -d --name umoja-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=umoja \
  -p 5432:5432 \
  postgres:15-alpine

# Then set DATABASE_URL in .env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/umoja
```

### Port already in use
- Change Django port: `python manage.py runserver 8001`
- Change React port: `npm run dev -- --port 3000`

### Node modules issues
```bash
rm -r node_modules package-lock.json
npm install
```

### Database migrations failed
```bash
# Reset database (WARNING: deletes all data)
python manage.py flush
python manage.py migrate
```

---

## Common Commands

### Backend
```bash
# Create superuser
python manage.py createsuperuser

# Run migrations
python manage.py migrate

# Create migration after model changes
python manage.py makemigrations

# Open Django shell
python manage.py shell

# Collect static files
python manage.py collectstatic --noinput
```

### Frontend
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Format code
npm run format
```

---

## Testing Registration Locally

1. **Start backend & frontend** (see above)
2. Go to http://localhost:5173/register
3. Fill in form:
   - First name: John
   - Last name: Doe
   - Email: john@example.com
   - Password: TestPassword123
   - Confirm: TestPassword123
   - Phone: +254712345678
   - Location: Select from dropdown
   - Role: Client
4. Click **"Create account"**

You should get **one of:**
- ✅ Email verification code screen (email works)
- ✅ Redirected to dashboard (email fallback works)
- ❌ Validation error message (check form)

---

## What to Download

You already have everything via Git clone. But if you need specific files:

```bash
# All source code
git clone https://github.com/Kimani145/umoja-skills.git

# Then install dependencies
cd umoja-skills
pip install -r backend/requirements.txt
npm install --prefix frontend
```

Done! Everything is now on your laptop. 🎉
