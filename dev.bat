@echo off
echo Starting Saadanam dev environment...

start "Django Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"
start "Vite Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers launching in separate windows.
