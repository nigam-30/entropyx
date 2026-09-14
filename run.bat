@echo off
setlocal enabledelayedexpansion
title EntropyX - System Diagnostics and Launcher

echo ======================================================================
echo    EntropyX: Automated Pre-Flight Check and Launcher
echo ======================================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: Step 1: Check Node.js
echo [1/5] Checking Node.js runtime...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Node.js is NOT installed or not in your PATH!
    echo Please install Node.js from https://nodejs.org/ and rerun this script.
    echo.
    pause
    exit /b 1
)
node -v
echo   [OK] Node.js is ready.

:: Step 2: Check npm
echo.
echo [2/5] Checking npm package manager...
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm is NOT found in PATH!
    echo.
    pause
    exit /b 1
)
call npm -v
echo   [OK] npm is ready.

:: Step 3: Check Frontend Dependencies (node_modules)
echo.
echo [3/5] Verifying React frontend dependencies...
if not exist "frontend\node_modules" (
    echo   [!] node_modules missing. Installing npm packages now, please wait...
    cd /d "%ROOT_DIR%frontend"
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo.
        echo [ERROR] npm install failed!
        cd /d "%ROOT_DIR%"
        pause
        exit /b 1
    )
    cd /d "%ROOT_DIR%"
    echo   [OK] Frontend dependencies installed successfully!
) else (
    echo   [OK] Frontend dependencies already installed.
)

:: Step 4: Check C++ Backend Binary
echo.
echo [4/5] Verifying C++ Backend Microservice...
if not exist "backend\bin\server.exe" (
    echo   [!] server.exe missing. Compiling C++ backend now...
    cd /d "%ROOT_DIR%backend"
    call build.bat
    if !ERRORLEVEL! neq 0 (
        echo.
        echo [ERROR] C++ compilation failed!
        cd /d "%ROOT_DIR%"
        pause
        exit /b 1
    )
    cd /d "%ROOT_DIR%"
    echo   [OK] C++ backend compiled successfully!
) else (
    echo   [OK] C++ backend binary present: backend\bin\server.exe
)

:: Ensure libwinpthread-1.dll is present if needed
if not exist "backend\bin\libwinpthread-1.dll" (
    if exist "C:\Program Files\JetBrains\CLion 2025.3.2\bin\mingw\bin\libwinpthread-1.dll" (
        copy /y "C:\Program Files\JetBrains\CLion 2025.3.2\bin\mingw\bin\libwinpthread-1.dll" "backend\bin\" >nul
    )
)

:: Step 5: Launch Services and Open Browser
echo.
echo [5/5] Launching Services...
echo   - Starting C++ REST Microservice on http://localhost:8080...
start "EntropyX Backend (Port 8080)" cmd /k "cd /d "%ROOT_DIR%backend" && bin\server.exe"

:: Wait 2 seconds for C++ server to start
echo   - Waiting for backend to bind port 8080...
ping -n 3 127.0.0.1 >nul

echo.
echo ======================================================================
echo   [SUCCESS] Starting Frontend (Browser will open automatically once ready)...
echo   - Backend:  http://localhost:8080
echo   - Frontend: http://localhost:5173
echo.
echo   (Keep this window OPEN while testing. Press Ctrl+C to stop.)
echo ======================================================================
echo.

cd /d "%ROOT_DIR%frontend"
call npm run dev -- --open

pause
