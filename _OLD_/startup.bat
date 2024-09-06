@echo off
for /f "delims=[] tokens=2" %%a in ('ping -4 -n 1 %ComputerName% ^| findstr [') do set NetworkIP=%%a
set port=80
netstat -ano | findstr /C:"%NetworkIP%:%port% "
IF ERRORLEVEL 1 (
    echo 서버를 시작합니다.
) ELSE (
    cls
    echo 이미 %port%번 포트가 사용중입니다. 새로운 포트를 입력해 주세요.
    set /p port=new port : 
)
python -m http.server %port%
start explorer http://localhost:%port%
pause