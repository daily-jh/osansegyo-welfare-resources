@echo off
setlocal
title Osan Youth - Local AI Bridge
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js 22 or newer is required. Install from https://nodejs.org/
  echo.
  pause
  exit /b 1
)
node "%~dp0local-bridge.mjs"
if errorlevel 1 (
  echo.
  echo Could not start. Check port 8765 and Node.js.
  pause
  exit /b 1
)
pause
