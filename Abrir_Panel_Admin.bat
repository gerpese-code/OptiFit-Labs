@echo off
title OptiFit Labs - Panel de Administracion Coach
color 0A
cd /d "%~dp0web"

echo ==============================================================================
echo                OPTIFIT LABS :: PANEL DE ADMINISTRACION COACH                  
echo ==============================================================================
echo.

:: Verificar si el servidor ya esta respondiendo en el puerto 3000
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/download' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>nul

if %ERRORLEVEL% EQU 0 (
    echo [OK] El servidor local ya se encuentra activo en el puerto 3000.
) else (
    echo [INICIANDO] Levantando servidor local de OptiFit Labs...
    start /min "OptiFit-Server" cmd /c "node ./node_modules/next/dist/bin/next dev -p 3000"
    timeout /t 4 /nobreak >nul
)

echo [ABRIENDO] Abriendo Panel de Administrador en tu navegador...
start http://localhost:3000/admin
exit
