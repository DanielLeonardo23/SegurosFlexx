@echo off
REM =================================================================
REM Script ETL Automatizado - PostgreSQL to MySQL Migration
REM Ejecuta el proceso completo de migración y levanta los servicios
REM =================================================================

echo ============================================
echo    ETL AUTOMATIZADO - SEGUROSFLEX
echo ============================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no está instalado o no está en PATH
    echo Por favor instale Python 3.7+ desde https://python.org
    pause
    exit /b 1
)

echo [PASO 1] Verificando prerequisitos...
echo ✓ Python detectado

REM Verificar si Docker está ejecutándose
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker no está instalado o no está ejecutándose
    echo Por favor inicie Docker Desktop
    pause
    exit /b 1
)

echo ✓ Docker detectado

REM Verificar si el dump de PostgreSQL existe
set POSTGRES_DUMP=C:\Users\John\Downloads\seguros_2025-02-27_120833.sql
if not exist "%POSTGRES_DUMP%" (
    echo ERROR: No se encuentra el dump de PostgreSQL en:
    echo %POSTGRES_DUMP%
    echo.
    set /p POSTGRES_DUMP=Por favor ingrese la ruta completa al dump: 
    if not exist "%POSTGRES_DUMP%" (
        echo ERROR: Archivo no encontrado
        pause
        exit /b 1
    )
)

echo ✓ Dump de PostgreSQL encontrado: %POSTGRES_DUMP%
echo.

echo [PASO 2] Limpiando contenedores y volúmenes anteriores...
docker-compose down -v >nul 2>&1
docker system prune -f >nul 2>&1
echo ✓ Limpieza completada

echo.
echo [PASO 3] Instalando dependencias ETL (si es necesario)...
call install-etl-deps.bat

echo.
echo [PASO 4] Ejecutando proceso ETL avanzado...
echo Convirtiendo dump de PostgreSQL a MySQL con análisis inteligente...

REM Ejecutar el script ETL avanzado de Python
python etl_advanced.py

if %errorlevel% neq 0 (
    echo ERROR: Falló el proceso ETL
    echo Intentando con ETL básico...
    python etl_postgres_to_mysql.py
    if %errorlevel% neq 0 (
        echo ERROR: Ambos procesos ETL fallaron
        pause
        exit /b 1
    )
)

echo ✓ Proceso ETL completado

echo.
echo [PASO 5] Construyendo contenedores Docker...
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo ERROR: Falló la construcción de contenedores
    pause
    exit /b 1
)

echo ✓ Contenedores construidos exitosamente

echo.
echo [PASO 6] Levantando servicios...
docker-compose up -d

if %errorlevel% neq 0 (
    echo ERROR: Falló el levantamiento de servicios
    pause
    exit /b 1
)

echo ✓ Servicios iniciados

echo.
echo [PASO 7] Esperando que MySQL esté listo...
timeout /t 15 /nobreak >nul

echo [PASO 8] Ejecutando script de migración en MySQL...
REM Ejecutar el script generado por ETL en MySQL
docker-compose exec -T mysql mysql -uroot -pmysqlroot segurosflex < segurosflex_mysql_etl_generated.sql

if %errorlevel% neq 0 (
    echo WARNING: Pudo haber errores en la migración. Verificar logs.
) else (
    echo ✓ Script de migración ejecutado
)

echo.
echo [PASO 9] Validando migración...
python validate_migration.py

if %errorlevel% neq 0 (
    echo WARNING: Se encontraron problemas en la validación
) else (
    echo ✓ Validación completada exitosamente
)

echo.
echo ============================================
echo           MIGRACIÓN COMPLETADA
echo ============================================
echo.
echo 🎉 El proceso ETL ha finalizado exitosamente!
echo.
echo Servicios disponibles:
echo 💻 Frontend (React):     http://localhost:3000
echo 🔐 Security Service:     http://localhost:3001
echo 👥 Beneficiarios:        http://localhost:3002
echo 👤 Personal Gestión:     http://localhost:3003
echo 💰 Presupuesto Pagos:    http://localhost:3004
echo 🔧 Talleres Proveedores: http://localhost:3005
echo 🗄️  MySQL Database:       localhost:3306
echo.
echo Para ver logs: docker-compose logs -f
echo Para detener:  docker-compose down
echo.

REM Mostrar estado de contenedores
echo Estado actual de contenedores:
docker-compose ps

echo.
echo Presione cualquier tecla para abrir el frontend...
pause >nul
start http://localhost:3000

echo.
echo ¿Desea ver los logs en tiempo real? (Y/N)
set /p SHOW_LOGS=
if /i "%SHOW_LOGS%"=="Y" (
    docker-compose logs -f
)

echo.
echo Proceso ETL completado. ¡Gracias por usar SegurosFlex!
pause
