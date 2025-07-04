# ETL PostgreSQL to MySQL - SegurosFlex

Este directorio contiene las herramientas de migración ETL (Extract, Transform, Load) para convertir automáticamente el sistema SegurosFlex de PostgreSQL a MySQL.

## 🚀 Proceso ETL Automatizado

### Archivos Principales

| Archivo | Descripción |
|---------|-------------|
| `etl-migrate.bat` | **Script principal** - Ejecuta todo el proceso ETL automáticamente |
| `etl_advanced.py` | **ETL Avanzado** - Conversión inteligente con análisis de esquema |
| `etl_postgres_to_mysql.py` | **ETL Básico** - Conversión simple como respaldo |
| `validate_migration.py` | **Validador** - Verifica integridad post-migración |
| `install-etl-deps.bat` | **Instalador** - Instala dependencias Python necesarias |

### Archivos Generados

| Archivo | Descripción |
|---------|-------------|
| `segurosflex_mysql_etl_generated.sql` | Script MySQL convertido automáticamente |
| `migration_report_*.txt` | Reporte detallado de la migración |
| `etl_conversion_log_*.txt` | Log completo del proceso ETL |
| `validation_report_*.json` | Reporte de validación en JSON |
| `validation_report_*.txt` | Reporte de validación en texto |

## 📋 Prerequisitos

### Software Requerido
- **Python 3.7+** - [Descargar aquí](https://python.org/downloads/)
- **Docker Desktop** - [Descargar aquí](https://docker.com/products/docker-desktop)
- **Git** (opcional) - Para clonar el repositorio

### Dependencias Python (se instalan automáticamente)
- `pymysql` - Conector MySQL
- `colorama` - Colores en terminal
- `requests` - Cliente HTTP
- `beautifulsoup4` - Parser HTML/XML

## 🎯 Uso Rápido

### Método 1: Script Automatizado (Recomendado)

```bash
# 1. Ejecutar migración completa
etl-migrate.bat
```

Este script ejecuta automáticamente:
1. ✅ Verificación de prerequisitos
2. 🧹 Limpieza de contenedores anteriores
3. 📦 Instalación de dependencias ETL
4. 🔄 Conversión PostgreSQL → MySQL
5. 🏗️ Construcción de contenedores Docker
6. 🚀 Levantamiento de servicios
7. 💾 Ejecución del script MySQL
8. ✔️ Validación de la migración

### Método 2: Manual

```bash
# 1. Instalar dependencias
install-etl-deps.bat

# 2. Ejecutar ETL avanzado
python etl_advanced.py

# 3. Levantar servicios
docker-compose up -d

# 4. Ejecutar migración
docker-compose exec mysql mysql -uroot -pmysqlroot segurosflex < segurosflex_mysql_etl_generated.sql

# 5. Validar migración
python validate_migration.py
```

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# MySQL (único motor de BD)
MYSQL_ROOT_PASSWORD=mysqlroot
MYSQL_DATABASE=segurosflex
MYSQL_USER=segurosflex_user
MYSQL_PASSWORD=segurosflex_pass

# Puertos de servicios
MYSQL_PORT=3306
FRONTEND_PORT=3000
SECURITY_PORT=3001
BENEFICIARIOS_PORT=3002
PERSONAL_PORT=3003
PRESUPUESTO_PORT=3004
TALLERES_PORT=3005
```

### Ruta del Dump PostgreSQL
Por defecto busca en: `C:\Users\John\Downloads\seguros_2025-02-27_120833.sql`

Para cambiar la ruta, modifica en `etl_advanced.py`:
```python
postgres_dump_path = "TU_RUTA_AQUI.sql"
```

## 📊 Características del ETL

### Conversiones Automáticas

| PostgreSQL | MySQL | Notas |
|------------|--------|-------|
| `SERIAL` | `INT AUTO_INCREMENT` | ✅ Completo |
| `BIGSERIAL` | `BIGINT AUTO_INCREMENT` | ✅ Completo |
| `TEXT` | `LONGTEXT` | ✅ Completo |
| `JSONB` | `JSON` | ✅ Compatible |
| `UUID` | `VARCHAR(36)` | ✅ Funcional |
| `BOOLEAN` | `BOOLEAN` | ✅ Compatible |
| `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP` | ⚠️ Sin zona horaria |
| `ARRAY[]` | `TEXT` | ⚠️ Requiere serialización |

### Análisis Inteligente
- 🔍 **Detección de esquema** - Analiza tablas, columnas, índices
- 📈 **Estadísticas de conversión** - Conteo de elementos procesados
- ⚠️ **Detección de problemas** - Identifica incompatibilidades
- 📋 **Recomendaciones** - Sugiere optimizaciones

### Validación Post-Migración
- 🔌 **Conectividad** - Verifica conexión a MySQL
- 🗂️ **Estructura** - Confirma existencia de tablas
- 🔗 **Integridad** - Valida relaciones y constraints
- ⚡ **Rendimiento** - Pruebas básicas de consultas

## 📈 Monitoreo

### Ver Logs en Tiempo Real
```bash
# Logs de todos los servicios
docker-compose logs -f

# Logs específicos
docker-compose logs -f mysql
docker-compose logs -f frontend
```

### Estado de Servicios
```bash
# Ver estado
docker-compose ps

# Reiniciar servicio específico
docker-compose restart mysql
```

### Acceso a MySQL
```bash
# Via Docker
docker-compose exec mysql mysql -uroot -pmysqlroot segurosflex

# Desde host (si MySQL client instalado)
mysql -h localhost -P 3306 -u root -p segurosflex
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Error: "Python no encontrado"
```bash
# Instalar Python desde python.org
# Verificar que esté en PATH
python --version
```

#### 2. Error: "Docker no está ejecutándose"
```bash
# Iniciar Docker Desktop
# Verificar estado
docker --version
```

#### 3. Error: "No se encuentra el dump PostgreSQL"
- Verificar que el archivo existe en la ruta especificada
- Actualizar la ruta en `etl_advanced.py` si es necesario

#### 4. Error: "Falló la construcción de contenedores"
```bash
# Limpiar Docker
docker system prune -a -f
docker-compose down -v

# Reconstruir
docker-compose build --no-cache
```

#### 5. Error: "MySQL no inicia"
```bash
# Verificar puerto disponible
netstat -an | findstr 3306

# Limpiar volúmenes
docker-compose down -v
```

### Logs de Depuración

#### ETL Logs
- `etl_conversion_log_*.txt` - Log detallado del proceso ETL
- `migration_report_*.txt` - Reporte de migración

#### Docker Logs
```bash
# Ver logs específicos con timestamp
docker-compose logs -f --timestamps mysql

# Ver últimas líneas
docker-compose logs --tail=100 mysql
```

## 🔒 Seguridad

### Configuración de Producción

1. **Cambiar contraseñas por defecto**
   ```env
   MYSQL_ROOT_PASSWORD=tu_password_seguro
   MYSQL_PASSWORD=password_usuario_seguro
   ```

2. **Configurar SSL** (opcional)
   - Generar certificados SSL
   - Configurar MySQL para SSL

3. **Firewall**
   - Cerrar puertos no necesarios
   - Permitir solo IPs específicas

### Backup y Restauración

```bash
# Backup
docker-compose exec mysql mysqldump -uroot -pmysqlroot segurosflex > backup_$(date +%Y%m%d).sql

# Restauración
docker-compose exec -T mysql mysql -uroot -pmysqlroot segurosflex < backup_20250101.sql
```

## 📚 Documentación Adicional

- [README principal](../README.md) - Información general del proyecto
- [Docker Compose](../docker-compose.yml) - Configuración de servicios
- [Frontend](../client/README.md) - Documentación del cliente React
- [Backend Services](../backend/) - Documentación de microservicios

## 🤝 Contribución

Para contribuir al ETL:

1. Crear branch para nueva funcionalidad
2. Modificar scripts ETL según necesidad
3. Probar con diferentes dumps PostgreSQL
4. Documentar cambios y limitaciones
5. Crear pull request

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs** - Verificar archivos de log generados
2. **Validar prerequisitos** - Confirmar Python, Docker instalados
3. **Limpiar entorno** - Ejecutar limpieza de Docker
4. **Reportar issue** - Con logs y detalles del error

---

## 🎉 ¡Migración Exitosa!

Una vez completado el ETL, tendrás:

- ✅ Base de datos MySQL funcionando
- ✅ Todos los microservicios dockerizados
- ✅ Frontend React operativo
- ✅ Datos migrados y validados
- ✅ Reportes de migración generados

**URLs de Acceso:**
- 💻 Frontend: http://localhost:3000
- 🔐 Security: http://localhost:3001
- 👥 Beneficiarios: http://localhost:3002
- 👤 Personal: http://localhost:3003
- 💰 Presupuesto: http://localhost:3004
- 🔧 Talleres: http://localhost:3005
- 🗄️ MySQL: localhost:3306

¡Disfruta tu sistema SegurosFlex migrado a MySQL! 🚀

---

## 🎯 ESTADO ACTUAL DEL PROYECTO (Julio 2025)

### ✅ COMPLETADO:
- ✅ **Migración de Dockerfiles**: Todos los microservicios eliminaron PostgreSQL y ahora solo usan MySQL
- ✅ **Docker Compose**: Configurado para usar únicamente MySQL (eliminado PostgreSQL)
- ✅ **Variables de Entorno**: Archivo `.env` configurado para MySQL
- ✅ **Scripts de Automatización**: Creados scripts batch para facilitar el uso
- ✅ **Script ETL Principal**: `etl_postgres_to_mysql.py` implementado y funcional
- ✅ **Validador de Migración**: Script avanzado para verificar migración (`validate_migration_advanced.py`)
- ✅ **Contenedor MySQL**: Ejecutándose correctamente con base de datos creada

### 🔧 EN PROCESO:
- 🔧 **Importación de Datos**: El script MySQL generado tiene problemas menores de sintaxis
- 🔧 **Refinamiento ETL**: Ajustes finales para compatibilidad 100% con MySQL

### 📊 Estado de los Microservicios

| Microservicio | Estado | Base de Datos | Puerto |
|---------------|--------|---------------|---------|
| **beneficiarios** | 🔄 Reiniciando | MySQL | 3001 |
| **personal-gestion** | 🔄 Reiniciando | MySQL | 3002 |
| **presupuesto-pagos** | 🔄 Reiniciando | MySQL | 3003 |
| **security** | ✅ Funcionando | MySQL | 3004 |
| **talleres-provedores** | 🔄 Reiniciando | MySQL | 3005 |
| **client** | ✅ Funcionando | - | 3000 |
| **mysql** | ✅ Funcionando | - | 3306 |

## 🔧 Configuración MySQL Actual

- **Host**: localhost
- **Puerto**: 3306  
- **Usuario**: root
- **Password**: admin123
- **Base de Datos**: segurosflex
- **Charset**: utf8mb4

## 🚀 Scripts de Uso Rápido

### 1. Ejecutar ETL Completo
```bash
# Opción 1: Script automático
run-etl.bat

# Opción 2: Manual
python etl_postgres_to_mysql.py

# Opción 3: Solo prueba
python test_etl.py
```

### 2. Iniciar Sistema
```bash
# Iniciar todos los servicios con MySQL
start-mysql.bat

# Verificar contenedores
docker ps
```

### 3. Validar Migración
```bash
# Ejecutar validación completa
python validate_migration_advanced.py

# Verificar base de datos manualmente
docker exec segurosflex_mysql mysql -u root -padmin123 -e "SHOW DATABASES;"
```

## 🛠️ Solución de Problemas Comunes

### Problema: Microservicios reiniciando
**Causa**: Los microservicios no pueden conectar a la base de datos  
**Solución**: 
1. Verificar que MySQL esté ejecutándose: `docker ps`
2. Verificar que la base de datos existe: `docker exec segurosflex_mysql mysql -u root -padmin123 -e "SHOW DATABASES;"`
3. Importar datos si es necesario: `Get-Content segurosflex_mysql_test.sql | docker exec -i segurosflex_mysql mysql -u root -padmin123`

### Problema: Script MySQL con errores
**Causa**: Algunas sintaxis de PostgreSQL no se convirtieron correctamente  
**Solución**: 
1. Revisar el archivo `segurosflex_mysql_test.sql`
2. Ejecutar validación: `python validate_migration_advanced.py`
3. Corregir manualmente los errores de sintaxis si es necesario

## 📈 Próximos Pasos

1. **Completar Importación de Datos**: Resolver problemas menores de sintaxis en el script MySQL
2. **Probar Microservicios**: Verificar que todos los servicios se conecten correctamente a MySQL
3. **Optimización**: Ajustar configuraciones de rendimiento de MySQL
4. **Testing**: Ejecutar pruebas completas del sistema migrado

---
**Estado del Proyecto**: 🟡 Funcional con ajustes menores pendientes  
**Última Actualización**: 2025-07-04  
**Versión ETL**: 2.0
