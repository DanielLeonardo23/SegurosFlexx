#!/bin/bash

# Script para construir y ejecutar todos los servicios
echo "🐳 Iniciando SegurosFlex con Docker..."

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📋 Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "⚠️  Por favor, edita el archivo .env con tus configuraciones antes de continuar."
    read -p "Presiona Enter para continuar..."
fi

# Construir y ejecutar los servicios
echo "🔨 Construyendo imágenes Docker..."
docker-compose build

echo "🚀 Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Mostrar estado de los servicios
echo "📊 Estado de los servicios:"
docker-compose ps

echo "✅ SegurosFlex está ejecutándose!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API Gateway: http://localhost:80"
echo "📊 Servicios individuales:"
echo "   - Beneficiarios: http://localhost:4000"
echo "   - Personal/Gestión: http://localhost:4001"
echo "   - Presupuesto/Pagos: http://localhost:4002"
echo "   - Talleres/Proveedores: http://localhost:4003"
echo "   - Security: http://localhost:4004"
echo "🗄️  PostgreSQL: localhost:5432"
echo "🗄️  MySQL: localhost:3306"
