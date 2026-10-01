@echo off
title Pother Bondhu - launcher
cd /d "%~dp0"

echo ==========================================
echo   POTHER BONDHU
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [X] Node not found. Install Node 20+ from nodejs.org, then run this again.
  pause
  exit /b 1
)

echo [1/5] Checking MongoDB on 127.0.0.1:27017 ...
powershell -NoProfile -Command "if ((Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue).TcpTestSucceeded) { exit 0 } else { exit 1 }"
if errorlevel 1 goto :nomongo
echo       MongoDB is up.

cd /d "%~dp0backend"

if exist "node_modules\" goto :apideps
echo [2/5] Installing backend packages. First time takes a few minutes ...
call npm install
:apideps

if exist ".env" goto :envready
echo [3/5] Writing backend\.env ...
set "SECRET="
for /f %%i in ('node -p "require('crypto').randomBytes(32).toString('hex')"') do set "SECRET=%%i"
if not defined SECRET set "SECRET=change_me_a_long_random_value_please"
> ".env" echo MONGODB_URI=mongodb://127.0.0.1:27017/potherbondhu
>> ".env" echo JWT_SECRET=%SECRET%
>> ".env" echo NODE_ENV=development
>> ".env" echo PORT=4000
>> ".env" echo CLIENT_URL=http://localhost:5175
>> ".env" echo SMTP_USER=
>> ".env" echo SMTP_PASS=
>> ".env" echo SENDER_EMAIL=
goto :envdone
:envready
echo [3/5] backend\.env already there.
:envdone
echo [4/5] Loading demo data if the database needs it ...
call npm run seed -- --if-needed

cd /d "%~dp0frontend"
if exist "node_modules\" goto :webdone
echo       Installing frontend packages ...
call npm install
:webdone

echo [5/5] Starting backend and frontend in their own windows ...
cd /d "%~dp0backend"
start "Pother Bondhu - BACKEND (4000)" cmd /k "npm run dev"
cd /d "%~dp0frontend"
start "Pother Bondhu - FRONTEND (5175)" cmd /k "npm run dev -- --port 5175"

echo.
echo   Open  http://localhost:5175
echo.
echo   Admin       admin@potherbondhu.com    /  Admin@1234
echo   Volunteer   nabila@potherbondhu.com   /  Volunteer@123
echo   Donor       mehedi@potherbondhu.com   /  Donor@1234
echo.
echo   Port 5175 on purpose, so this and the Course Compass
echo   can run at the same time without clashing.
echo.
timeout /t 15 /nobreak >nul
start "" http://localhost:5175
pause
exit /b 0

:nomongo
echo.
echo [X] Nothing is listening on port 27017, so MongoDB is not running.
echo.
echo     Install MongoDB Community Server for Windows once:
echo       https://www.mongodb.com/try/download/community
echo     Tick "Install MongoDB as a Service" during setup, then it
echo     starts by itself every time you boot.
echo.
echo     Already installed? Open cmd as Administrator and run:  net start MongoDB
echo.
pause
exit /b 1
