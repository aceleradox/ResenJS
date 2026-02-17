@echo off
cd /d "%~dp0"

start "" cmd /c node resen.js
timeout /t 2 >nul
start "" cmd /c npx electron ResenGui.js

waitfor /T 999999 ElectronClosed >nul
taskkill /f /im node.exe >nul
