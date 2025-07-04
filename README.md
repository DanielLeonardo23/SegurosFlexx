# SegurosFlex - Sistema de Gestión de Seguros

Sistema de gestión de seguros con arquitectura de microservicios desarrollado con Node.js y React.

## 🏗️ Arquitectura

El proyecto está compuesto por los siguientes microservicios:

- **Beneficiarios** (Puerto 4000): Gestión de beneficiarios de seguros
- **Personal-Gestión** (Puerto 4001): Gestión de personal y recursos humanos
- **Presupuesto-Pagos** (Puerto 4002): Gestión de presupuestos y pagos
- **Talleres-Proveedores** (Puerto 4003): Gestión de talleres y proveedores
- **Security** (Puerto 4004): Autenticación y autorización
- **Cliente React** (Puerto 3000): Frontend de la aplicación

## 🐳 Despliegue con Docker

### Prerrequisitos

- Docker
- Docker Compose
- Git

### Instalación y Ejecución

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd SegurosFlex
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus configuraciones específicas.

3. **Ejecutar con Docker (Opción 1 - Scripts automáticos)**
   
   **En Windows:**
   ```cmd
   start.bat
   ```
   
   **En Linux/MacOS:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

4. **Ejecutar con Docker (Opción 2 - Manual)**
   ```bash
   # Construir las imágenes
   docker-compose build
   
   # Ejecutar los servicios
   docker-compose up -d
   
   # Ver el estado de los servicios
   docker-compose ps
   ```

### URLs de Acceso

Una vez iniciado el sistema:

- **Frontend**: http://localhost:3000
- **API Gateway (Nginx)**: http://localhost:80
- **Microservicios individuales**:
  - Beneficiarios: http://localhost:4000
  - Personal/Gestión: http://localhost:4001
  - Presupuesto/Pagos: http://localhost:4002
  - Talleres/Proveedores: http://localhost:4003
  - Security: http://localhost:4004

### Bases de Datos

- **PostgreSQL**: localhost:5432
  - Usuario: postgres
  - Contraseña: admin123
  - Base de datos: segurosflex

- **MySQL**: localhost:3306
  - Usuario: mysql_user
  - Contraseña: admin123
  - Base de datos: segurosflex

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Ver logs de todos los servicios
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs beneficiarios

# Seguir logs en tiempo real
docker-compose logs -f

# Reiniciar un servicio específico
docker-compose restart beneficiarios

# Parar todos los servicios
docker-compose down

# Parar y eliminar volúmenes
docker-compose down -v

# Parar y eliminar todo (imágenes, volúmenes, etc.)
docker-compose down --rmi all -v
```

### Scripts de Utilidad

**Detener servicios:**
- Windows: `stop.bat`
- Linux/MacOS: `./stop.sh`

**Detener y limpiar volúmenes:**
- Windows: `stop.bat --volumes`
- Linux/MacOS: `./stop.sh --volumes`

**Limpieza completa:**
- Windows: `stop.bat --clean`
- Linux/MacOS: `./stop.sh --clean`
