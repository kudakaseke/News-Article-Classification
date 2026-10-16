@echo off
cd /d "%~dp0"
set "PROJECT_PYTHON=%~dp0..\.venv\Scripts\python.exe"
if not exist "%PROJECT_PYTHON%" set "PROJECT_PYTHON=%~dp0.venv\Scripts\python.exe"
if not exist "%PROJECT_PYTHON%" (
  echo Follow README.md to install the project environment first.
  pause
  exit /b 1
)
if not exist ".runtime\ipython" mkdir ".runtime\ipython"
if not exist ".runtime\jupyter" mkdir ".runtime\jupyter"
set "IPYTHONDIR=%~dp0.runtime\ipython"
set "JUPYTER_RUNTIME_DIR=%~dp0.runtime\jupyter"
set "JUPYTER_PREFER_ENV_PATH=1"
"%PROJECT_PYTHON%" -m notebook Zim_News_Classification.ipynb
pause
