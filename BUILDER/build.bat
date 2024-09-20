@echo off
chcp 65001 >nul
setlocal

set NODE_VERSION=v18.19.4
set NODE_MSI=node-v%NODE_VERSION%-x64.msi
set NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%NODE_MSI%

:: Node.js 설치 여부 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js가 설치되어 있지 않습니다. 설치를 진행합니다.
    echo 다운로드 중...
    powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_MSI%'"
    if %errorlevel% neq 0 (
        echo Node.js 다운로드 실패
        exit /b 1
    )
    echo 설치 중...
    msiexec /i %NODE_MSI% /quiet
    if %errorlevel% neq 0 (
        echo Node.js 설치 실패
        exit /b 1
    )
    echo Node.js 설치 완료
    del %NODE_MSI%
) else (
    echo Node.js가 설치되어 있습니다.
)

echo chokidar 설치 여부 확인 중...

:: chokidar 설치 여부 확인
npm list -g --depth=0 2>&1 | findstr /i "chokidar" >nul
if %ERRORLEVEL% neq 0 (
    echo chokidar가 설치되어 있지 않습니다. chokidar를 설치 중입니다...
    npm install -g chokidar
    if %errorlevel% neq 0 (
        echo chokidar 설치 실패
        exit /b 1
    )
) else (
    echo chokidar가 이미 설치되어 있습니다.
)

echo terser 설치 여부 확인 중...

:: terser 설치 여부 확인
npm list -g --depth=0 2>&1 | findstr /i "terser" >nul
if %ERRORLEVEL% neq 0 (
    echo terser가 설치되어 있지 않습니다. terser를 설치 중입니다...
    npm install -g terser
    if %errorlevel% neq 0 (
        echo terser 설치 실패
        exit /b 1
    )
) else (
    echo terser가 이미 설치되어 있습니다.
)

:: buildScript.js 스크립트 실행
echo 병합 스크립트 실행 중...
node buildScript.js
if %errorlevel% neq 0 (
    echo 스크립트 실행 중 오류 발생
    exit /b 1
)

pause
endlocal