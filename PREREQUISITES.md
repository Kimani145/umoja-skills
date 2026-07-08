# Prerequisites Checklist

## What You Need to Download & Install

### 1. **Python 3.11 or higher**
   - Download: https://www.python.org/downloads/
   - **Windows:** Download installer and run it
     - ✅ Check "Add Python to PATH"
     - ✅ Check "pip"
   - Verify: Open PowerShell and run `python --version`

### 2. **Node.js 18 or higher**
   - Download: https://nodejs.org/
   - **Windows:** Download LTS installer and run it
   - Verify: Open PowerShell and run `node --version` and `npm --version`

### 3. **Git**
   - Download: https://git-scm.com/downloads
   - **Windows:** Download and run installer
   - Verify: Open PowerShell and run `git --version`

### 4. **PostgreSQL (Optional - can use Docker instead)**
   - Download: https://www.postgresql.org/download/windows/
   - Or use Docker for easier setup (see below)

### 5. **Docker (Optional but Recommended)**
   - Download: https://www.docker.com/products/docker-desktop
   - Easier than installing PostgreSQL separately
   - Verify: Open PowerShell and run `docker --version`

---

## Quick Start (3 Steps)

### Step 1: Clone the Project
```powershell
git clone https://github.com/Kimani145/umoja-skills.git
cd umoja-skills
```

### Step 2: Run Setup Script (Windows)
```powershell
.\setup.bat
```

Or **Manual Setup** (follow LOCAL_SETUP.md)

### Step 3: Start the App

**Terminal 1 (Backend):**
```powershell
cd backend
.\.venv\Scripts\activate.bat
python manage.py runserver
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

**Open browser:**
- http://localhost:5173 (Frontend)
- http://localhost:8000/api/ (Backend)

---

## If Using Docker (Easiest)

Just install **Docker Desktop**, then:

```powershell
cd umoja-skills
docker-compose up
```

Everything runs automatically. Visit:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000/api/

---

## File Structure After Setup

```
umoja-skills/
├── backend/
│   ├── .venv/              (Python virtual env - auto created)
│   ├── .env                (Database credentials - edit this)
│   ├── requirements.txt    (Python dependencies)
│   └── manage.py           (Django CLI)
├── frontend/
│   ├── node_modules/       (NPM packages - auto created)
│   ├── .env.local          (API URL config)
│   ├── package.json        (Node dependencies)
│   └── src/                (React code)
├── docker-compose.yml      (Optional Docker setup)
└── LOCAL_SETUP.md          (Full setup guide)
```

---

## Troubleshooting

### "python: command not found"
→ Python not installed or not in PATH
→ Download from https://www.python.org/downloads/
→ Reinstall and check "Add to PATH"

### "npm: command not found"
→ Node.js not installed
→ Download from https://nodejs.org/

### "psycopg2 error"
→ PostgreSQL not installed or wrong DATABASE_URL
→ Use Docker: `docker-compose up db -d`

### Port 8000 or 5173 already in use
→ Change port: `python manage.py runserver 8001`
→ Or kill the process using the port

---

## Questions?

Check LOCAL_SETUP.md for detailed instructions or:
- Backend issues → Check backend logs
- Frontend issues → Check browser console (F12)
- Database issues → Use `docker-compose up db`
