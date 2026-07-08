@echo off
REM Quick Local Setup Script for Windows
REM Run this from the umoja-skills directory

echo ===== Umoja Skills Local Setup =====
echo.

REM Clone if not already cloned
if not exist ".git" (
    echo Cloning repository...
    git clone https://github.com/Kimani145/umoja-skills.git
    cd umoja-skills
)

REM Setup Backend
echo.
echo [1/4] Setting up backend...
cd backend
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt -q

echo Copying environment file...
if not exist ".env" (
    copy .env.example .env
    echo Created .env - please edit with your settings
)

echo Running migrations...
python manage.py migrate --noinput

cd ..

REM Setup Frontend
echo.
echo [2/4] Setting up frontend...
cd frontend
echo Installing Node dependencies...
npm install --legacy-peer-deps -q

echo Copying environment file...
if not exist ".env.local" (
    copy .env.example .env.local
    echo Created .env.local
)

cd ..

REM Setup done
echo.
echo [3/4] Setup complete!
echo.
echo [4/4] Next steps:
echo.
echo To start the backend:
echo   1. cd backend
echo   2. .\.venv\Scripts\activate.bat
echo   3. python manage.py runserver 0.0.0.0:8000
echo.
echo To start the frontend (in a new terminal):
echo   1. cd frontend
echo   2. npm run dev
echo.
echo Then visit:
echo   - Frontend: http://localhost:5173
echo   - Backend: http://localhost:8000/api/
echo.
pause
