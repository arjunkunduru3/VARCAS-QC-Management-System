@echo off
title VARCAS Automobiles QC Management System

echo ==========================================
echo   VARCAS QC Management System
echo ==========================================
echo.

REM Move to the installer/application folder
cd /d "%~dp0"

echo Starting portable MySQL server...

REM Start MySQL on port 3307
start "VARCAS MySQL" /min "%~dp0mysql\bin\mysqld.exe" ^
  --basedir="%~dp0mysql" ^
  --datadir="%~dp0mysql\data" ^
  --port=3307 ^
  --bind-address=127.0.0.1 ^
  --mysqlx=OFF

echo Waiting for MySQL to start...
timeout /t 5 /nobreak >nul

echo Starting VARCAS server...

cd /d "%~dp0server"

start "VARCAS Server" /min "%~dp0runtime\node.exe" server.js

echo Waiting for VARCAS server...
timeout /t 5 /nobreak >nul

echo Opening VARCAS...
start "" "http://localhost:5000"

echo.
echo ==========================================
echo   VARCAS is running
echo ==========================================
echo.
echo You can close this window.
echo The application will continue running.
echo.