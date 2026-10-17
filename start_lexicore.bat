@echo off
title Lexicore Suite — AI SaaS Platform Launcher
color 0B
cls

echo ===============================================================================
echo                LEXICORE SUITE // AI SAAS ENTERPRISE PLATFORM
echo       Autonomous Cloud ^& Desktop Platform for Law, Tax ^& CPA Practices
echo ===============================================================================
echo.

:: 1. Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not detected on your system PATH!
    echo Please download and install Node.js v20+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node -v
echo.

:: 2. Check if .env exists, if not copy from .env.example
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example template...
        copy ".env.example" ".env" >nul
        echo [OK] .env configuration file initialized.
    )
)

:: 3. Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] First-time setup detected. Installing production dependencies...
    echo This may take 1-2 minutes depending on your internet connection...
    echo.
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] npm install encountered an issue. Please run 'npm install --legacy-peer-deps' manually.
        pause
        exit /b 1
    )
    echo [OK] Dependencies successfully installed.
    echo.
)

:: 4. Display 3-Month SaaS License Information
echo -------------------------------------------------------------------------------
echo                    ACTIVE 3-MONTH SAAS LICENSE CREDENTIALS
echo -------------------------------------------------------------------------------
echo   Plan:         Enterprise Partner (SaaS)
echo   Duration:     90 Days (Valid through December 27, 2026)
echo   License Key:  LEXI-SAAS-2026-90D-88F4-A92B-4E1C
echo -------------------------------------------------------------------------------
echo.

:: 5. Open browser automatically after delay
echo [INFO] Starting Lexicore Next.js server on http://localhost:3000 ...
echo [INFO] Your default web browser will open automatically in 5 seconds...
echo.

start "" "http://localhost:3000"

:: 6. Launch Next.js dev server
call npm run dev

pause
