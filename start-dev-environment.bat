@echo off
REM Single entry point for grc-lms-main: run this whenever you're opening
REM the project. Starts Docker/Jitsi, MySQL, Laravel, Vite, and Reverb
REM (real-time) together — nothing auto-starts on Windows login anymore.

echo Starting Docker Desktop (for Jitsi)...
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I "Docker Desktop.exe" >NUL
if errorlevel 1 (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
)

echo Waiting for Docker engine to be ready...
:wait_docker
docker ps >NUL 2>&1
if errorlevel 1 (
    timeout /t 3 /nobreak >nul
    goto wait_docker
)

echo Starting Jitsi containers...
cd /d C:\docker\docker-jitsi-meet
docker compose up -d

echo Starting MySQL...
start "MySQL" /min cmd /c "C:\xampp\mysql_start.bat"
timeout /t 5 /nobreak >nul

cd /d C:\xampp\grc-lms-main

echo Starting Laravel (php artisan serve)...
start "Laravel Serve" cmd /k "php artisan serve"

echo Starting Vite (npm run dev)...
start "Vite Dev" cmd /k "npm run dev"

echo Starting Reverb (real-time)...
start "Reverb" cmd /k "php artisan reverb:start"

echo.
echo All services launching. Docker/Jitsi may take ~30-60s on a cold start,
echo Vite ~30-60s to finish compiling.
