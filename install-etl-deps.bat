@echo off
REM =================================================================
REM Script de instalación de dependencias para ETL
REM Instala Python, pip y las librerías necesarias
REM =================================================================

echo ============================================
echo    INSTALACIÓN DE DEPENDENCIAS ETL
echo ============================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python no está instalado. Por favor instale Python 3.7+ desde:
    echo https://python.org/downloads/
    echo.
    echo Después de la instalación, ejecute este script nuevamente.
    pause
    exit /b 1
)

echo ✓ Python está instalado
python --version

REM Verificar pip
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando pip...
    python -m ensurepip --upgrade
)

echo ✓ pip está disponible

echo.
echo Instalando dependencias Python para ETL...

REM Instalar PyMySQL para conectividad MySQL
echo [1/3] Instalando PyMySQL...
pip install pymysql

REM Instalar otras dependencias útiles
echo [2/3] Instalando dependencias adicionales...
pip install requests beautifulsoup4

REM Instalar herramientas de desarrollo
echo [3/3] Instalando herramientas de desarrollo...
pip install colorama

echo.
echo ✅ Todas las dependencias han sido instaladas exitosamente!
echo.
echo Dependencias instaladas:
echo • PyMySQL - Conector MySQL para Python
echo • Requests - Cliente HTTP
echo • BeautifulSoup4 - Parser HTML/XML
echo • Colorama - Colores en terminal
echo.

echo ============================================
echo    INSTALACIÓN COMPLETADA
echo ============================================
echo.
echo Ahora puede ejecutar el ETL con:
echo   python etl_advanced.py
echo.
echo O usar el script automatizado:
echo   etl-migrate.bat
echo.

pause
