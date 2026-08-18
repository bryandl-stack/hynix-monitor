@echo off
title SK Hynix Monitor

cd /d "%~dp0"

echo.
echo  ================================
echo    SK Hynix Monitor
echo    KRX / NXT / NASDAQ ADR / Binance
echo  ================================
echo.

if not exist "node_modules" (
    echo [1/2] Installing packages...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo.
)

echo [2/2] Starting dev server...
echo.
echo  Browser will open automatically in 3 seconds.
echo  Press Ctrl+C to stop the server.
echo.

start "" cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

call npm run dev

pause