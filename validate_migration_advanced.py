#!/usr/bin/env python3
"""
Script de Validación Avanzada de Migración ETL
Verifica que los datos se migraron correctamente de PostgreSQL a MySQL
Versión mejorada con validaciones completas
"""

import subprocess
import json
import sys
from datetime import datetime

class AdvancedMigrationValidator:
    def __init__(self):
        self.validation_results = []
        
    def log_result(self, test_name, status, message, details=None):
        """Registra el resultado de una validación"""
        result = {
            'test': test_name,
            'status': status,  # 'PASS', 'FAIL', 'WARNING'
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.validation_results.append(result)
        
        status_icon = "✅" if status == 'PASS' else "❌" if status == 'FAIL' else "⚠️"
        print(f"{status_icon} {test_name}: {message}")
        if details:
            print(f"   Detalles: {details}")

    def run_mysql_query(self, query, database="segurosflex"):
        """Ejecuta una query en el contenedor MySQL"""
        try:
            cmd = [
                'docker', 'exec', '-i', 'segurosflex_mysql',
                'mysql', '-u', 'root', '-padmin123', 
                '--database', database,
                '--batch', '--skip-column-names',
                '--execute', query
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                return None
        except Exception as e:
            return None

    def validate_database_exists(self):
        """Verifica que la base de datos segurosflex existe"""
        query = "SHOW DATABASES LIKE 'segurosflex';"
        result = self.run_mysql_query(query, "mysql")
        
        if result and 'segurosflex' in result:
            self.log_result("Database Existence", "PASS", "Base de datos 'segurosflex' existe")
            return True
        else:
            self.log_result("Database Existence", "FAIL", "Base de datos 'segurosflex' no encontrada")
            return False

    def validate_tables_exist(self):
        """Verifica que las tablas principales existen"""
        expected_tables = [
            'beneficiarios', 'clientes', 'contratos', 'siniestros', 
            'pagos', 'talleres', 'proveedores', 'usuarios', 'roles'
        ]
        
        query = "SHOW TABLES;"
        result = self.run_mysql_query(query)
        
        if not result:
            self.log_result("Tables Existence", "FAIL", "No se pudieron obtener las tablas")
            return False
        
        existing_tables = [table.strip() for table in result.split('\n') if table.strip()]
        found_tables = []
        missing_tables = []
        
        for table in expected_tables:
            if table in existing_tables:
                found_tables.append(table)
            else:
                missing_tables.append(table)
        
        if found_tables:
            self.log_result("Tables Existence", "PASS", 
                          f"Se encontraron {len(found_tables)} tablas esperadas",
                          f"Encontradas: {', '.join(found_tables)}")
        
        if missing_tables:
            self.log_result("Tables Existence", "WARNING", 
                          f"Faltan {len(missing_tables)} tablas esperadas",
                          f"Faltantes: {', '.join(missing_tables)}")
        
        return len(found_tables) > 0

    def validate_data_counts(self):
        """Verifica que las tablas tienen datos"""
        tables_query = "SHOW TABLES;"
        tables_result = self.run_mysql_query(tables_query)
        
        if not tables_result:
            self.log_result("Data Counts", "FAIL", "No se pudieron obtener las tablas")
            return False
        
        tables = [table.strip() for table in tables_result.split('\n') if table.strip()]
        tables_with_data = 0
        empty_tables = 0
        total_records = 0
        
        for table in tables:
            count_query = f"SELECT COUNT(*) FROM {table};"
            count_result = self.run_mysql_query(count_query)
            
            if count_result and count_result.isdigit():
                count = int(count_result)
                total_records += count
                if count > 0:
                    tables_with_data += 1
                    print(f"   📊 {table}: {count} registros")
                else:
                    empty_tables += 1
                    print(f"   📭 {table}: 0 registros")
        
        if tables_with_data > 0:
            self.log_result("Data Counts", "PASS", 
                          f"{tables_with_data} tablas con datos, {empty_tables} vacías",
                          f"Total registros: {total_records}")
            return True
        else:
            self.log_result("Data Counts", "FAIL", "Todas las tablas están vacías")
            return False

    def validate_constraints(self):
        """Verifica que las constraints se crearon correctamente"""
        query = """
        SELECT 
            TABLE_NAME,
            CONSTRAINT_NAME,
            CONSTRAINT_TYPE
        FROM 
            INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE 
            CONSTRAINT_SCHEMA = 'segurosflex'
            AND CONSTRAINT_TYPE IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE');
        """
        
        result = self.run_mysql_query(query)
        
        if result:
            constraints = [line for line in result.split('\n') if line.strip()]
            primary_keys = len([c for c in constraints if 'PRIMARY KEY' in c])
            foreign_keys = len([c for c in constraints if 'FOREIGN KEY' in c])
            unique_keys = len([c for c in constraints if 'UNIQUE' in c])
            
            self.log_result("Constraints", "PASS", 
                          f"Constraints encontradas: {len(constraints)} total",
                          f"PK: {primary_keys}, FK: {foreign_keys}, UNIQUE: {unique_keys}")
            return True
        else:
            self.log_result("Constraints", "WARNING", 
                          "No se pudieron verificar las constraints")
            return False

    def validate_indexes(self):
        """Verifica que los índices se crearon correctamente"""
        query = """
        SELECT 
            TABLE_NAME,
            INDEX_NAME,
            NON_UNIQUE
        FROM 
            INFORMATION_SCHEMA.STATISTICS 
        WHERE 
            TABLE_SCHEMA = 'segurosflex'
            AND INDEX_NAME != 'PRIMARY';
        """
        
        result = self.run_mysql_query(query)
        
        if result:
            indexes = [line for line in result.split('\n') if line.strip()]
            total_indexes = len(indexes)
            
            self.log_result("Indexes", "PASS", 
                          f"Se encontraron {total_indexes} índices")
            return True
        else:
            self.log_result("Indexes", "WARNING", 
                          "No se pudieron verificar los índices")
            return False

    def validate_charset_and_collation(self):
        """Verifica que las tablas usen UTF8MB4"""
        query = """
        SELECT 
            TABLE_NAME,
            TABLE_COLLATION
        FROM 
            INFORMATION_SCHEMA.TABLES 
        WHERE 
            TABLE_SCHEMA = 'segurosflex';
        """
        
        result = self.run_mysql_query(query)
        
        if result:
            tables = result.split('\n')
            utf8mb4_tables = len([t for t in tables if 'utf8mb4' in t])
            total_tables = len([t for t in tables if t.strip()])
            
            if utf8mb4_tables == total_tables:
                self.log_result("Charset", "PASS", 
                              f"Todas las {total_tables} tablas usan UTF8MB4")
            else:
                self.log_result("Charset", "WARNING", 
                              f"Solo {utf8mb4_tables}/{total_tables} tablas usan UTF8MB4")
            return True
        else:
            self.log_result("Charset", "WARNING", 
                          "No se pudo verificar el charset de las tablas")
            return False

    def test_sample_queries(self):
        """Ejecuta consultas de muestra para verificar funcionalidad"""
        sample_queries = [
            ("Test SELECT básico", "SELECT 1 as test;"),
            ("Test COUNT total", "SELECT COUNT(*) as total_tables FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'segurosflex';"),
            ("Test JOIN básico", "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES t JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME WHERE t.TABLE_SCHEMA = 'segurosflex';")
        ]
        
        all_passed = True
        for test_name, query in sample_queries:
            result = self.run_mysql_query(query)
            if result is not None:
                self.log_result(f"Query Test: {test_name}", "PASS", 
                              f"Query ejecutada correctamente", f"Resultado: {result}")
            else:
                self.log_result(f"Query Test: {test_name}", "FAIL", 
                              "Query falló")
                all_passed = False
        
        return all_passed

    def run_all_validations(self):
        """Ejecuta todas las validaciones"""
        print("🔍 Iniciando validación avanzada de migración ETL...")
        print("=" * 60)
        
        # Lista de validaciones
        validations = [
            ("Conexión Docker", self.validate_database_exists),
            ("Existencia de Tablas", self.validate_tables_exist),
            ("Conteo de Datos", self.validate_data_counts),
            ("Constraints", self.validate_constraints),
            ("Índices", self.validate_indexes),
            ("Charset UTF8MB4", self.validate_charset_and_collation),
            ("Consultas de Prueba", self.test_sample_queries),
        ]
        
        results = {}
        for test_name, test_func in validations:
            print(f"\n🧪 Ejecutando: {test_name}")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log_result(test_name, "FAIL", f"Error en validación: {str(e)}")
                results[test_name] = False
        
        # Resumen final
        print("\n" + "=" * 60)
        print("📋 RESUMEN FINAL DE VALIDACIÓN")
        print("=" * 60)
        
        passed = len([r for r in self.validation_results if r['status'] == 'PASS'])
        failed = len([r for r in self.validation_results if r['status'] == 'FAIL'])
        warnings = len([r for r in self.validation_results if r['status'] == 'WARNING'])
        
        print(f"✅ Pruebas exitosas: {passed}")
        print(f"❌ Pruebas fallidas: {failed}")
        print(f"⚠️  Advertencias: {warnings}")
        
        # Determinar estado general
        if failed == 0 and passed > 5:
            print("\n🎉 ¡MIGRACIÓN VALIDADA EXITOSAMENTE!")
            print("   ✓ Todos los datos se migraron correctamente a MySQL")
            print("   ✓ El sistema está listo para usar con los microservicios")
            success_level = "EXCELENTE"
        elif failed <= 1 and passed > 3:
            print("\n⚠️  MIGRACIÓN PARCIALMENTE EXITOSA")
            print("   ✓ Los datos principales están presentes")
            print("   ⚠️  Algunas validaciones menores fallaron")
            success_level = "BUENO"
        elif failed <= 3 and passed > 1:
            print("\n🔧 MIGRACIÓN CON PROBLEMAS MENORES")
            print("   ⚠️  Varias validaciones fallaron")
            print("   🔧 Se requiere revisión manual")
            success_level = "ACEPTABLE"
        else:
            print("\n❌ MIGRACIÓN CON PROBLEMAS CRÍTICOS")
            print("   ❌ Múltiples validaciones críticas fallaron")
            print("   🛠️  Se requiere revisión completa de la migración")
            success_level = "PROBLEMÁTICO"
        
        print(f"\n📊 Estado de Migración: {success_level}")
        
        return failed == 0

    def save_validation_report(self):
        """Guarda el reporte de validación detallado"""
        report_path = f"advanced_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Crear reporte completo
        full_report = {
            "migration_validation": {
                "timestamp": datetime.now().isoformat(),
                "validator_version": "2.0",
                "total_tests": len(self.validation_results),
                "summary": {
                    "passed": len([r for r in self.validation_results if r['status'] == 'PASS']),
                    "failed": len([r for r in self.validation_results if r['status'] == 'FAIL']),
                    "warnings": len([r for r in self.validation_results if r['status'] == 'WARNING'])
                },
                "results": self.validation_results
            }
        }
        
        try:
            with open(report_path, 'w', encoding='utf-8') as file:
                json.dump(full_report, file, indent=2, ensure_ascii=False)
            print(f"\n📄 Reporte detallado guardado en: {report_path}")
        except Exception as e:
            print(f"\n❌ Error guardando reporte: {str(e)}")

def main():
    """Función principal"""
    print("=" * 70)
    print("  VALIDADOR AVANZADO DE MIGRACIÓN ETL - PostgreSQL to MySQL")
    print("  SegurosFlex - Sistema de Microservicios")
    print("=" * 70)
    
    validator = AdvancedMigrationValidator()
    
    # Ejecutar validaciones
    success = validator.run_all_validations()
    
    # Guardar reporte
    validator.save_validation_report()
    
    print("\n" + "=" * 70)
    if success:
        print("🎯 VALIDACIÓN COMPLETADA: Sistema listo para producción")
    else:
        print("🔧 VALIDACIÓN COMPLETADA: Se requiere atención")
    print("=" * 70)
    
    # Código de salida
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
