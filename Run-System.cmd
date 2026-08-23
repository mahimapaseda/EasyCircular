@echo off
REM EasyCircular - double-click this file to start the system
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run-System.ps1" %*
