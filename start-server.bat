@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.12+ is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules\vite\package.json (
  echo Installing dependencies...
  call npm ci
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)
echo Local preview: http://127.0.0.1:5174/
start "" "http://127.0.0.1:5174/"
call npm run dev
endlocal
