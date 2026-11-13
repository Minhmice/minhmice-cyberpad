@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   Minhmice Cyberpad - WebHID Onboard Flasher (Offline)
echo ========================================================
echo.
echo 1. Trinh duyet Edge/Chrome se tu dong mo http://localhost:8088
echo 2. Nhan "Connect keypad" va chon 1189:8842
echo 3. Nhan "Import" va chon file: firmware\webhid-profile.json
echo 4. Nhan "Write to keypad" de nap thang vao chip!
echo.
echo Nhan Ctrl+C de dung server khi da nap xong.
echo.

start "" "http://localhost:8088"
python -m http.server 8088 --directory flasher-web
pause
