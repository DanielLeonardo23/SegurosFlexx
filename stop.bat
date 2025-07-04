@echo off

echo 🛑 Deteniendo SegurosFlex...

REM Detener todos los servicios
docker-compose down

REM Remover volúmenes si se especifica
if "%1"=="--volumes" (
    echo 🗑️  Removiendo volúmenes...
    docker-compose down -v
)

REM Remover imágenes si se especifica
if "%1"=="--clean" (
    echo 🧹 Limpiando imágenes...
    docker-compose down --rmi all -v
)

echo ✅ SegurosFlex detenido correctamente.
pause
