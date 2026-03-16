@echo off
echo Starting SpendWise Project...

echo Starting Backend Server...
start "SpendWise Backend" cmd /k "cd backend && node server.js"

echo Starting Frontend Dev Server...
start "SpendWise Frontend" cmd /k "cd frontend && npm run dev"

echo Done! Both servers are starting in separate windows.
pause
