@echo off
title SK Hynix Monitor

:: bat 파일이 있는 폴더로 이동 (어디서 실행해도 동작)
cd /d "%~dp0"

echo.
echo  ================================
echo    SK Hynix Monitor
echo    KRX / NXT / NASDAQ ADR / Binance
echo  ================================
echo.

:: node_modules 없으면 설치
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

:: 3초 뒤 브라우저 자동 오픈 (서버 준비 시간 확보)
start "" cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

call npm run dev

pause
