# Script para limpiar y preparar dependencias antes del build
echo "🧹 Limpiando dependencias problemáticas..."

# Eliminar node_modules y package-lock.json de todos los microservicios
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "backend\beneficiarios\node_modules"
Remove-Item -Force -ErrorAction SilentlyContinue "backend\beneficiarios\package-lock.json"

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "backend\personal-gestion\node_modules"
Remove-Item -Force -ErrorAction SilentlyContinue "backend\personal-gestion\package-lock.json"

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "backend\presupuesto-pagos\node_modules"
Remove-Item -Force -ErrorAction SilentlyContinue "backend\presupuesto-pagos\package-lock.json"

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "backend\talleres-provedores\node_modules"
Remove-Item -Force -ErrorAction SilentlyContinue "backend\talleres-provedores\package-lock.json"

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "backend\security\node_modules"
Remove-Item -Force -ErrorAction SilentlyContinue "backend\security\package-lock.json"

echo "✅ Limpieza completada. Ahora ejecuta docker-compose build"
