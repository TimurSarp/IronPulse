@echo off
title IronPulse Yerel Sunucu
echo ===================================================
echo   IronPulse Baslatiliyor...
echo   Tarayiciniz otomatik olarak acilacaktir.
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
