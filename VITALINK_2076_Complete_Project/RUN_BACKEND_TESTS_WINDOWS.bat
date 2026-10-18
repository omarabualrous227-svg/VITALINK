@echo off
cd /d "%~dp0"
echo Running VITALINK backend integration tests...
npm test
pause
