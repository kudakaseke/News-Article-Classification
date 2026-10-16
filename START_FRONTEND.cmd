@echo off
cd /d "%~dp0"
set "PROJECT_PYTHON=%~dp0..\.venv\Scripts\python.exe"
if not exist "%PROJECT_PYTHON%" set "PROJECT_PYTHON=%~dp0.venv\Scripts\python.exe"
if not exist "%PROJECT_PYTHON%" (
  echo Follow README.md to set up the project Python environment first.
  pause
  exit /b 1
)
echo Opening Zim News Studio at http://127.0.0.1:8765
echo Keep this window open while using the front end. Press Ctrl+C to stop.
start "" "http://127.0.0.1:8765"
"%PROJECT_PYTHON%" -m http.server 8765 --bind 127.0.0.1 --directory "%~dp0frontend\dist"
pause
