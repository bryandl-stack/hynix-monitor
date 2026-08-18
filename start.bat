@echo off
chcp 65001 > nul
title SK하이닉스 모니터

:: bat 파일이 있는 폴더로 이동 (어디서 실행해도 동작)
cd /d "%~dp0"

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
echo  3초 후 브라우저가 자동으로 열립니다.
echo  종료하려면 Ctrl+C 를 누르세요.
echo.

:: 3초 뒤 브라우저 자동 오픈 (서버 준비 시간 확보)
start "" cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

call npm run dev

pause
