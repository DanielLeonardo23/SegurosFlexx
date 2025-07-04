@echo off
echo 🔧 Solucionando problemas de dependencias...

echo 1️⃣ Limpiando Docker...
docker-compose down
docker system prune -f

echo 2️⃣ Limpiando dependencias locales...
if exist "backend\beneficiarios\node_modules" rmdir /s /q "backend\beneficiarios\node_modules"
if exist "backend\beneficiarios\package-lock.json" del "backend\beneficiarios\package-lock.json"

if exist "backend\personal-gestion\node_modules" rmdir /s /q "backend\personal-gestion\node_modules"
if exist "backend\personal-gestion\package-lock.json" del "backend\personal-gestion\package-lock.json"

if exist "backend\presupuesto-pagos\node_modules" rmdir /s /q "backend\presupuesto-pagos\node_modules"
if exist "backend\presupuesto-pagos\package-lock.json" del "backend\presupuesto-pagos\package-lock.json"

if exist "backend\talleres-provedores\node_modules" rmdir /s /q "backend\talleres-provedores\node_modules"
if exist "backend\talleres-provedores\package-lock.json" del "backend\talleres-provedores\package-lock.json"

if exist "backend\security\node_modules" rmdir /s /q "backend\security\node_modules"
if exist "backend\security\package-lock.json" del "backend\security\package-lock.json"

if exist "client\node_modules" rmdir /s /q "client\node_modules"
if exist "client\package-lock.json" del "client\package-lock.json"

echo 3️⃣ Construyendo servicios paso a paso...

echo 📊 Construyendo bases de datos...
docker-compose build postgres mysql

echo 🔐 Construyendo microservicio security...
docker-compose build security

echo 👥 Construyendo microservicio beneficiarios...
docker-compose build beneficiarios

echo 🏢 Construyendo microservicio personal-gestion...
docker-compose build personal-gestion

echo 💰 Construyendo microservicio presupuesto-pagos...
docker-compose build presupuesto-pagos

echo 🔧 Construyendo microservicio talleres-provedores...
docker-compose build talleres-provedores

echo 🌐 Construyendo frontend (client)...
docker-compose build client

echo 🔄 Construyendo nginx...
docker-compose build nginx

echo 4️⃣ Iniciando servicios...
docker-compose up -d

echo 5️⃣ Esperando que los servicios estén listos...
timeout /t 30 /nobreak > nul

echo 📊 Estado de los servicios:
docker-compose ps

echo.
echo ✅ Proceso completado!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 API Gateway: http://localhost:80
echo 📊 Microservicios:
echo    - Beneficiarios: http://localhost:4000
echo    - Personal/Gestión: http://localhost:4001
echo    - Presupuesto/Pagos: http://localhost:4002
echo    - Talleres/Proveedores: http://localhost:4003
echo    - Security: http://localhost:4004

echo.
echo 💡 Si hay errores, ejecuta: docker-compose logs [nombre-servicio]
pause
