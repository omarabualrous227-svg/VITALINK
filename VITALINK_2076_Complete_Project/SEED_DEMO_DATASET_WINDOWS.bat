@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.5+ is required.
  pause
  exit /b 1
)
node scripts\seed-demo-state.js %*
pause
