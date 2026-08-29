@echo off
title VARCAS Database Setup

echo ==========================================
echo   VARCAS QC Management System
echo   Database Setup
echo ==========================================
echo.

set /p DBPASSWORD=Enter MySQL root password: 

echo.
echo Creating database if it does not exist...
echo.

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p%DBPASSWORD% -e "CREATE DATABASE IF NOT EXISTS qc_management_system;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to create/connect to the database.
    pause
    exit /b 1
)

echo.
echo Importing VARCAS database...
echo.

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p%DBPASSWORD% qc_management_system < "%~dp0qc_management_system.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   Database setup completed successfully!
    echo ==========================================
) else (
    echo.
    echo ==========================================
    echo   Database setup failed.
    echo ==========================================
)

echo.
pause