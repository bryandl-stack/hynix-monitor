@echo off
chcp 65001 > nul
title SK하이닉스 모니터

echo.
echo  ╔══════════════════════════════════════╗
echo  ║      SK하이닉스 시세 모니터          ║
echo  ║   KRX · NXT · NASDAQ ADR · Binance  ║
echo  ╚══════════════════════════════════════╝
echo.

:: node_modules 없으면 설치
if not exist "node_modules" (
    echo [1/2] 패키지 설치 중...
    call npm install
    if errorlevel 1 (
        echo [오류] npm install 실패
        pause
        exit /b 1
    )
    echo.
)

echo [2/2] 개발 서버 시작 중...
echo.
echo  브라우저에서 http://localhost:3000 을 열어주세요.
echo  종료하려면 Ctrl+C 를 누르세요.
echo.

call npm run dev

pause
