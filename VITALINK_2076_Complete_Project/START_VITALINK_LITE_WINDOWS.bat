@echo off
cd /d "%~dp0"
echo VITALINK 2076 - Zero-Dependency Backend
echo Open: http://localhost:8080
start "" "http://localhost:8080"
node server-lite.js
pause
