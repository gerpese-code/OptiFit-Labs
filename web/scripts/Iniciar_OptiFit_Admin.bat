@echo off
title OptiFit Labs - Panel Administrador
cd /d "C:\Users\germa\OneDrive\Documents\Fitness-Pro\web"

rem Verificar si el servidor ya esta corriendo en el puerto 3000
netstat -ano | findstr :3000 >nul
if errorlevel 1 (
    echo [OptiFit Labs] Iniciando servidor web de administracion...
    start /min "OptiFit Labs Server" cmd /c "npm run dev"
    timeout /t 3 /nobreak >nul
)

rem Abrir panel de alumnos directamente en Mozilla Firefox
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files\Mozilla Firefox\firefox.exe" "http://localhost:3000/admin/clients"
) else (
    start "" "http://localhost:3000/admin/clients"
)
exit
