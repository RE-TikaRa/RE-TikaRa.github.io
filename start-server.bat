@echo off
setlocal
cd /d "%~dp0"
python -m http.server 5173
endlocal
