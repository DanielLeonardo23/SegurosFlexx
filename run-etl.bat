@echo off
echo =====================================
echo  ETL PostgreSQL to MySQL - SegurosFlex
echo =====================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado o no está en el PATH
    echo Instale Python desde https://python.org
    pause
    exit /b 1
)

REM Verificar si Docker está ejecutándose
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no está ejecutándose o no está instalado
    echo Inicie Docker Desktop y vuelva a intentar
    pause
    exit /b 1
)

echo Python y Docker detectados correctamente.
echo.

REM Verificar si el contenedor MySQL está ejecutándose
echo Verificando contenedor MySQL...
docker ps | findstr "segurosflex-mysql" >nul
if errorlevel 1 (
    echo El contenedor MySQL no está ejecutándose.
    echo ¿Desea iniciarlo? (Y/n)
    set /p start_mysql=
    if /i not "%start_mysql%"=="n" (
        echo Iniciando contenedores...
        call start-mysql.bat
        timeout /t 10 >nul
    )
)

echo.
echo Ejecutando ETL...
echo.
python etl_postgres_to_mysql.py

echo.
echo =====================================
echo  ETL Completado
echo =====================================
pause
