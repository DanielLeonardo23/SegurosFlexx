@echo off
REM Script para Windows PowerShell/CMD

echo 🐳 Iniciando SegurosFlex con Docker...

REM Verificar si Docker Desktop está ejecutándose
echo 🔍 Verificando Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop no está ejecutándose.
    echo 🚀 Iniciando Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo ⏳ Esperando a que Docker Desktop inicie... (60 segundos)
    timeout /t 60 /nobreak > nul
    
    REM Verificar nuevamente
    docker --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Error: Docker Desktop no pudo iniciarse.
        echo 📝 Por favor:
        echo    1. Instala Docker Desktop si no está instalado
        echo    2. Inicia Docker Desktop manualmente
        echo    3. Espera a que esté completamente cargado
        echo    4. Ejecuta este script nuevamente
        pause
        exit /b 1
    )
)

echo ✅ Docker Desktop está funcionando.

REM Crear archivo .env si no existe
if not exist .env (
    echo 📋 Creando archivo .env desde .env.example...
    copy .env.example .env
    echo ⚠️  Por favor, edita el archivo .env con tus configuraciones antes de continuar.
    pause
)

REM Construir y ejecutar los servicios
echo 🔨 Construyendo imágenes Docker...
docker-compose build
if %errorlevel% neq 0 (
    echo ❌ Error al construir las imágenes.
    pause
    exit /b 1
)

echo 🚀 Iniciando servicios...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Error al iniciar los servicios.
    pause
    exit /b 1
)

REM Esperar a que los servicios estén listos
echo ⏳ Esperando a que los servicios estén listos...
timeout /t 30 /nobreak > nul

REM Mostrar estado de los servicios
echo 📊 Estado de los servicios:
docker-compose ps

echo.
echo ✅ SegurosFlex está ejecutándose!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 API Gateway: http://localhost:80
echo 📊 Servicios individuales:
echo    - Beneficiarios: http://localhost:4000
echo    - Personal/Gestión: http://localhost:4001
echo    - Presupuesto/Pagos: http://localhost:4002
echo    - Talleres/Proveedores: http://localhost:4003
echo    - Security: http://localhost:4004
echo 🗄️  PostgreSQL: localhost:5432
echo 🗄️  MySQL: localhost:3306
echo.
echo 💡 Para ver logs: docker-compose logs -f
echo 💡 Para detener: stop.bat

pause
