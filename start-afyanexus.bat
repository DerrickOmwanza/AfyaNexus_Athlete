@echo off
title AfyaNexus Launcher

echo ========================================
echo   AfyaNexus System Launcher
echo ========================================
echo.
echo Starting Backend Server (port 5000)...
start "AfyaNexus Backend" cmd /k "cd /d "c:\Users\ADMIN\Web&Standalone Applications\AfyaNexus_System\server" && npm run dev"

echo Starting ML Service (port 5001)...
start "AfyaNexus ML Service" cmd /k "cd /d "c:\Users\ADMIN\Web&Standalone Applications\AfyaNexus_System\ml" && python app.py"

echo Starting Frontend (port 4000)...
start "AfyaNexus Frontend" cmd /k "cd /d "c:\Users\ADMIN\Web&Standalone Applications\AfyaNexus_System\client" && node node_modules/next/dist/bin/next dev --port 4000"

echo.
echo ========================================
echo   All services starting...
echo   Frontend:  http://localhost:4000
echo   Backend:   http://localhost:5000
echo   ML:        http://localhost:5001
echo ========================================
echo.
echo Keep this window open to monitor services.
pause
