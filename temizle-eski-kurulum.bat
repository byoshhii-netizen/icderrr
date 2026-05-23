@echo off
echo ========================================
echo ICDER KURBAN PROGRAMI - ESKİ KURULUM TEMİZLEME
echo ========================================
echo.

echo [1/4] Programlar kapatiliyor...
taskkill /F /IM "DefterdarMuhasebe.exe" 2>nul
taskkill /F /IM "icder-kurban.exe" 2>nul
timeout /t 2 >nul

echo [2/4] Eski kurulum klasorleri siliniyor...
if exist "%LOCALAPPDATA%\Programs\DefterdarMuhasebe" (
    rmdir /s /q "%LOCALAPPDATA%\Programs\DefterdarMuhasebe"
    echo - Defterdar Muhasebe silindi
)
if exist "%LOCALAPPDATA%\Programs\ICDER Kurban Programi" (
    rmdir /s /q "%LOCALAPPDATA%\Programs\ICDER Kurban Programi"
    echo - ICDER Kurban Programi (eski) silindi
)
if exist "%ProgramFiles%\DefterdarMuhasebe" (
    rmdir /s /q "%ProgramFiles%\DefterdarMuhasebe"
    echo - Program Files\Defterdar silindi
)

echo [3/4] Masaustu kisayollari siliniyor...
if exist "%USERPROFILE%\Desktop\Defterdar Muhasebe.lnk" (
    del "%USERPROFILE%\Desktop\Defterdar Muhasebe.lnk"
    echo - Defterdar kisayolu silindi
)
if exist "%USERPROFILE%\Desktop\ICDER Kurban Programi.lnk" (
    del "%USERPROFILE%\Desktop\ICDER Kurban Programi.lnk"
    echo - ICDER kisayolu silindi
)

echo [4/4] Baslat menusu temizleniyor...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Defterdar Muhasebe.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Defterdar Muhasebe.lnk"
)
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\ICDER Kurban Programi.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\ICDER Kurban Programi.lnk"
)

echo.
echo ========================================
echo TEMIZLEME TAMAMLANDI!
echo ========================================
echo.
echo Simdi yeni EXE'yi kurabilirsiniz:
echo "ICDER Kurban Programi Setup 1.0.1.exe"
echo.
pause
