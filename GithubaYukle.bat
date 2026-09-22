@echo off
title IronPulse - GitHub'a Yukle
echo ===================================================
echo   IronPulse - GitHub'a Gonderiliyor...
echo ===================================================
echo.

:: Git yolunu garantiye alalim
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

git status

echo.
echo GitHub'a push baslatiliyor...
echo (Eger ilk kez baglaniyorsaniz tarayicinizda GitHub onay penceresi acilacaktir)
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ===================================================
    echo  BASARILI: Tum dosyalar GitHub'a yuklendi!
    echo  GitHub Adresiniz: https://github.com/TimurSarp/IronPulse
    echo  Canli Site (Pages): https://timursarp.github.io/IronPulse/
    echo ===================================================
) else (
    echo ===================================================
    echo  Gonderme sirasinda bir hata olustu.
    echo ===================================================
)

pause
