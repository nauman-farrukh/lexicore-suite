@echo off
setlocal enabledelayedexpansion
title Lexicore Suite — GitHub & Vercel Deployment Assistant
color 0B

echo ===============================================================================
echo            LEXICORE SUITE v2.0 - GITHUB & VERCEL DEPLOYMENT ASSISTANT
echo ===============================================================================
echo.

:: Ensure portable git is in PATH
set "GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd"
if exist "%GIT_CMD%\git.exe" (
    set "PATH=%GIT_CMD%;%PATH%"
)

where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not found in PATH or %GIT_CMD%.
    pause
    exit /b 1
)

echo [1/3] Verifying Git status and commits...
git status --short
echo.
echo Current branch:
git branch --show-current
echo.

echo ===============================================================================
echo  STEP 1: Push to GitHub
echo ===============================================================================
echo  1. Create a new empty repository at https://github.com/new
echo  2. Copy the repository URL (e.g., https://github.com/YOUR_USER/lexicore-suite.git)
echo.
set /p REPO_URL="Enter your GitHub Repository URL (or press Enter to skip GitHub push): "

if not "!REPO_URL!"=="" (
    echo.
    echo Linking remote origin to: !REPO_URL!...
    git remote remove origin >nul 2>&1
    git remote add origin !REPO_URL!
    git branch -M main
    echo Pushing main branch to GitHub...
    git push -u origin main
    if %ERRORLEVEL% equ 0 (
        echo.
        echo [SUCCESS] Code successfully pushed to GitHub!
    ) else (
        echo.
        echo [WARNING] GitHub push encountered an issue. Check your authentication or repository URL.
    )
) else (
    echo [INFO] Skipped GitHub push.
)

echo.
echo ===============================================================================
echo  STEP 2: Deploy to Vercel
echo ===============================================================================
echo  Options:
echo   [A] Connect via Vercel Dashboard (RECOMMENDED):
echo       1. Go to https://vercel.com/new
echo       2. Import your GitHub repository 'lexicore-suite'
echo       3. Add environment variables:
echo          - DATABASE_URL: Your PostgreSQL connection string
echo          - GEMINI_API_KEY: Your Google Gemini API key
echo       4. Click Deploy.
echo.
echo   [B] Deploy now via Vercel CLI:
set /p RUN_VERCEL="Would you like to run Vercel CLI now? (Y/N): "
if /i "!RUN_VERCEL!"=="Y" (
    echo Running npx vercel...
    call npx vercel
)

echo.
echo ===============================================================================
echo Deployment helper completed!
echo ===============================================================================
pause
