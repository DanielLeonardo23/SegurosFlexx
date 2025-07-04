@echo off
echo 🚀 Iniciando SegurosFlex con MySQL únicamente...

echo 1️⃣ Deteniendo servicios anteriores...
docker-compose down

echo 2️⃣ Limpiando contenedores...
docker-compose rm -f

echo 3️⃣ Iniciando MySQL...
docker-compose up -d mysql

echo 4️⃣ Esperando que MySQL esté listo...
timeout /t 30 /nobreak > nul

echo 5️⃣ Iniciando microservicios...
docker-compose up -d beneficiarios personal-gestion presupuesto-pagos talleres-provedores security

echo 6️⃣ Esperando que los microservicios estén listos...
timeout /t 20 /nobreak > nul

echo 7️⃣ Iniciando frontend...
docker-compose up -d client

echo 📊 Estado final de los servicios:
docker-compose ps

echo.
echo ✅ SegurosFlex iniciado correctamente!
echo 🗄️  MySQL: localhost:3306
echo 📊 Microservicios:
echo    - Beneficiarios: http://localhost:4000
echo    - Personal/Gestión: http://localhost:4001
echo    - Presupuesto/Pagos: http://localhost:4002
echo    - Talleres/Proveedores: http://localhost:4003
echo    - Security: http://localhost:4004
echo 🌐 Frontend: http://localhost:3000

echo.
echo 💡 Para ver logs: docker-compose logs -f [servicio]
echo 💡 Para detener: docker-compose down

pause
