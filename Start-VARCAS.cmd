@echo off
setlocal

REM =====================================================
REM VARCAS QC MANAGEMENT SYSTEM - STARTER
REM =====================================================

set "APP=%~dp0"
set "MYSQL=%APP%mysql\bin"
set "RUNTIME=%APP%runtime"
set "SERVER=%APP%server"

REM Database location - writable by normal Windows user
set "DATA=%LOCALAPPDATA%\VARCAS QC Management System\mysql-data"

REM Create database data directory
if not exist "%DATA%\mysql" (
    echo Initializing VARCAS MySQL database...
    if not exist "%DATA%" mkdir "%DATA%"

    "%MYSQL%\mysqld.exe" ^
        --initialize-insecure ^
        --basedir="%APP%mysql" ^
        --datadir="%DATA%"

    if errorlevel 1 (
        echo ERROR: MySQL initialization failed.
        pause
        exit /b 1
    )
)

REM =====================================================
REM START MYSQL
REM =====================================================

echo Starting VARCAS MySQL...

start "VARCAS MySQL" /min "%MYSQL%\mysqld.exe" ^
    --basedir="%APP%mysql" ^
    --datadir="%DATA%" ^
    --port=3307 ^
    --bind-address=127.0.0.1

REM Wait for MySQL
echo Waiting for MySQL...

set "READY="

for /L %%i in (1,1,30) do (
    "%MYSQL%\mysqladmin.exe" -h 127.0.0.1 -P 3307 -u root ping >nul 2>&1

    if not errorlevel 1 (
        set "READY=1"
        goto MYSQL_READY
    )

    timeout /t 1 /nobreak >nul
)

:MYSQL_READY

if not defined READY (
    echo ERROR: MySQL did not start.
    pause
    exit /b 1
)

echo MySQL is running.

REM =====================================================
REM CREATE DATABASE
REM =====================================================

"%MYSQL%\mysql.exe" -h 127.0.0.1 -P 3307 -u root -e "CREATE DATABASE IF NOT EXISTS qc_management_system;"

REM =====================================================
REM IMPORT DATABASE ON FIRST RUN
REM =====================================================

if not exist "%DATA%\VARCAS_DATABASE_INSTALLED.flag" (

    echo Installing VARCAS database...

    "%MYSQL%\mysql.exe" ^
        -h 127.0.0.1 ^
        -P 3307 ^
        -u root ^
        qc_management_system < "%APP%database\qc_management_system.sql"

    if errorlevel 1 (
        echo ERROR: Database installation failed.
        pause
        exit /b 1
    )

    echo Database installed successfully.

    echo installed > "%DATA%\VARCAS_DATABASE_INSTALLED.flag"
)

REM =====================================================
REM START NODE SERVER
REM =====================================================

echo Starting VARCAS server...

cd /d "%SERVER%"

start "VARCAS Server" /min "%RUNTIME%\node.exe" server.js

REM Give Node time to start
timeout /t 3 /nobreak >nul

REM =====================================================
REM OPEN APPLICATION
REM =====================================================

start "" "http://localhost:5000"

endlocal
exit /b 0