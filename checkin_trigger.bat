@echo off
echo 🔐 ESSL Device Check-in Trigger
echo ================================
echo Adding your check-in to the website...
echo.

cd /d "%~dp0"
node trigger_checkin.js

echo.
echo ✅ Check-in added to website!
echo 🌐 Open your website: http://localhost:5174
echo.
pause










