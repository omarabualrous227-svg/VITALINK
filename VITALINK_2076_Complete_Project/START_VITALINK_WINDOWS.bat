@echo off
cd /d "%~dp0"
echo.
echo ==============================================
echo   VITALINK 2076 - Multi-Device Backend
echo ==============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.5+ is required.
  pause
  exit /b 1
)
node -e "require('express');require('ws')" >nul 2>nul
if errorlevel 1 (
  echo Installing Express and WebSocket dependencies...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo npm install failed. Starting zero-dependency backend.
    start "" "http://localhost:8080"
    node server-lite.js
    pause
    exit /b
  )
)
echo Starting VITALINK at http://localhost:8080
echo Keep this window open.
echo.
start "" "http://localhost:8080"
node server.js
pause
