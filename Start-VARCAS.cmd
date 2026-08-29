@echo off
cd /d "%~dp0server"

start "VARCAS Server" /min "%~dp0runtime\node.exe" server.js

timeout /t 3 /nobreak >nul

start "" "http://localhost:5000"