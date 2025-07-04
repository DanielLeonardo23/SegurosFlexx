#!/bin/bash

echo "🛑 Deteniendo SegurosFlex..."

# Detener todos los servicios
docker-compose down

# Remover volúmenes si se especifica
if [ "$1" = "--volumes" ]; then
    echo "🗑️  Removiendo volúmenes..."
    docker-compose down -v
fi

# Remover imágenes si se especifica
if [ "$1" = "--clean" ]; then
    echo "🧹 Limpiando imágenes..."
    docker-compose down --rmi all -v
fi

echo "✅ SegurosFlex detenido correctamente."
