@echo off
echo 🔍 Verificando instalación de Docker...

REM Verificar Docker
docker --version
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado o no está en el PATH
    echo 📥 Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM Verificar Docker Compose
docker-compose --version
if %errorlevel% neq 0 (
    echo ❌ Docker Compose no está disponible
    pause
    exit /b 1
)

REM Verificar si Docker daemon está ejecutándose
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker daemon no está ejecutándose
    echo 🚀 Iniciando Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo ⏳ Esperando 60 segundos...
    timeout /t 60 /nobreak > nul
    
    docker ps >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Desktop no pudo iniciarse automáticamente
        echo 📝 Inicia Docker Desktop manualmente y espera a que cargue completamente
        pause
        exit /b 1
    )
)

echo ✅ Docker está funcionando correctamente!
echo 📊 Contenedores actuales:
docker ps

pause
