@echo off
setlocal

:: Node.js 설치 여부 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js가 설치되어 있지 않습니다. 설치를 진행합니다.
    echo 다운로드 중...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.4/node-v18.19.4-x64.msi' -OutFile 'nodejs.msi'"
    echo 설치 중...
    msiexec /i nodejs.msi /quiet
    echo Node.js 설치 완료
    del nodejs.msi
) else (
    echo Node.js가 설치되어 있습니다.
)

echo chokidar 설치 여부 확인 중...

:: chokidar 설치 여부 확인
npm list -g --depth=0 2>&1 | findstr /i "chokidar" >nul
if %ERRORLEVEL% neq 0 (
    echo chokidar가 설치되어 있지 않습니다. chokidar를 설치 중입니다...
    npm install -g chokidar
) else (
    echo chokidar가 이미 설치되어 있습니다.
)

:: buildScript.js 스크립트 실행
echo 병합 스크립트 실행 중...
node buildScript.js

pause

endlocal
