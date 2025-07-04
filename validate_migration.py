#!/usr/bin/env python3
"""
Script de validación post-migración ETL
Verifica la integridad de los datos y la estructura después de la migración
"""

import os
import json
import subprocess
from datetime import datetime

class MigrationValidator:
    def __init__(self):
        self.validation_results = {
            'timestamp': datetime.now().isoformat(),
            'database_connection': False,
            'tables_exist': [],
            'tables_missing': [],
            'data_integrity': {},
            'performance_metrics': {},
            'recommendations': []
        }

    def log_validation(self, message, level="INFO"):
        """Registra eventos de validación"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def test_database_connection(self):
        """Prueba la conexión a MySQL"""
        self.log_validation("Probando conexión a MySQL...")
        
        try:
            import pymysql
            connection = pymysql.connect(
                host='localhost',
                port=3306,
                user='root',
                password='mysqlroot',
                database='segurosflex',
                charset='utf8mb4'
            )
            
            with connection.cursor() as cursor:
                cursor.execute("SELECT VERSION()")
                version = cursor.fetchone()
                self.log_validation(f"✓ Conectado a MySQL {version[0]}")
                self.validation_results['database_connection'] = True
                return True
                
        except ImportError:
            self.log_validation("PyMySQL no disponible, usando Docker...", "WARNING")
            return self._test_connection_docker()
        except Exception as e:
            self.log_validation(f"❌ Error de conexión: {str(e)}", "ERROR")
            return False

    def _test_connection_docker(self):
        """Método alternativo usando Docker"""
        try:
            result = subprocess.run([
                'docker-compose', 'exec', '-T', 'mysql', 
                'mysql', '-uroot', '-pmysqlroot', '-e', 'SELECT VERSION();'
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.log_validation("✓ Conexión MySQL via Docker exitosa")
                self.validation_results['database_connection'] = True
                return True
            else:
                self.log_validation(f"❌ Error Docker MySQL: {result.stderr}", "ERROR")
                return False
        except Exception as e:
            self.log_validation(f"❌ Error ejecutando Docker: {str(e)}", "ERROR")
            return False

    def validate_table_structure(self):
        """Valida que las tablas principales existan"""
        self.log_validation("Validando estructura de tablas...")
        
        expected_tables = [
            'usuarios', 'roles', 'permisos',
            'beneficiarios', 'personal', 
            'presupuestos', 'pagos',
            'talleres', 'proveedores'
        ]
        
        try:
            result = subprocess.run([
                'docker-compose', 'exec', '-T', 'mysql', 
                'mysql', '-uroot', '-pmysqlroot', 'segurosflex',
                '-e', 'SHOW TABLES;'
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                existing_tables = [line.strip() for line in result.stdout.split('\n') 
                                 if line.strip() and not line.startswith('Tables_in_')]
                
                for table in expected_tables:
                    if table in existing_tables:
                        self.validation_results['tables_exist'].append(table)
                        self.log_validation(f"✓ Tabla '{table}' existe")
                    else:
                        self.validation_results['tables_missing'].append(table)
                        self.log_validation(f"⚠️  Tabla '{table}' no encontrada", "WARNING")
                
                # Verificar tablas adicionales no esperadas
                extra_tables = set(existing_tables) - set(expected_tables)
                if extra_tables:
                    self.log_validation(f"ℹ️  Tablas adicionales encontradas: {', '.join(extra_tables)}")
                
                return True
            else:
                self.log_validation(f"❌ Error consultando tablas: {result.stderr}", "ERROR")
                return False
                
        except Exception as e:
            self.log_validation(f"❌ Error validando tablas: {str(e)}", "ERROR")
            return False

    def validate_data_integrity(self):
        """Valida la integridad de los datos"""
        self.log_validation("Validando integridad de datos...")
        
        integrity_queries = {
            'total_records': "SELECT 'usuarios' as tabla, COUNT(*) as total FROM usuarios UNION ALL SELECT 'beneficiarios', COUNT(*) FROM beneficiarios;",
            'foreign_keys': "SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = 'segurosflex';",
            'null_constraints': "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'segurosflex' AND IS_NULLABLE = 'NO';",
            'indexes': "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'segurosflex';"
        }
        
        for test_name, query in integrity_queries.items():
            try:
                result = subprocess.run([
                    'docker-compose', 'exec', '-T', 'mysql', 
                    'mysql', '-uroot', '-pmysqlroot', 'segurosflex',
                    '-e', query
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    output_lines = [line.strip() for line in result.stdout.split('\n') if line.strip()]
                    self.validation_results['data_integrity'][test_name] = output_lines
                    self.log_validation(f"✓ {test_name}: {len(output_lines)} resultados")
                else:
                    self.log_validation(f"⚠️  Error en {test_name}: {result.stderr}", "WARNING")
                    
            except Exception as e:
                self.log_validation(f"❌ Error en {test_name}: {str(e)}", "ERROR")

    def performance_test(self):
        """Ejecuta pruebas básicas de rendimiento"""
        self.log_validation("Ejecutando pruebas de rendimiento...")
        
        performance_queries = [
            ("simple_select", "SELECT COUNT(*) FROM usuarios;"),
            ("join_query", "SELECT COUNT(*) FROM usuarios u LEFT JOIN beneficiarios b ON u.id = b.usuario_id;"),
            ("complex_query", "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'segurosflex';")
        ]
        
        for test_name, query in performance_queries:
            try:
                start_time = datetime.now()
                
                result = subprocess.run([
                    'docker-compose', 'exec', '-T', 'mysql', 
                    'mysql', '-uroot', '-pmysqlroot', 'segurosflex',
                    '-e', query
                ], capture_output=True, text=True, timeout=30)
                
                end_time = datetime.now()
                execution_time = (end_time - start_time).total_seconds()
                
                if result.returncode == 0:
                    self.validation_results['performance_metrics'][test_name] = {
                        'execution_time_seconds': execution_time,
                        'status': 'success'
                    }
                    self.log_validation(f"✓ {test_name}: {execution_time:.3f}s")
                else:
                    self.validation_results['performance_metrics'][test_name] = {
                        'execution_time_seconds': execution_time,
                        'status': 'error',
                        'error': result.stderr
                    }
                    self.log_validation(f"❌ {test_name} falló: {result.stderr}", "ERROR")
                    
            except Exception as e:
                self.log_validation(f"❌ Error en test {test_name}: {str(e)}", "ERROR")

    def generate_recommendations(self):
        """Genera recomendaciones basadas en la validación"""
        self.log_validation("Generando recomendaciones...")
        
        recommendations = []
        
        # Recomendaciones basadas en tablas faltantes
        if self.validation_results['tables_missing']:
            recommendations.append(f"Crear tablas faltantes: {', '.join(self.validation_results['tables_missing'])}")
        
        # Recomendaciones de rendimiento
        for test_name, metrics in self.validation_results['performance_metrics'].items():
            if metrics.get('execution_time_seconds', 0) > 5:
                recommendations.append(f"Optimizar consulta {test_name} (tiempo: {metrics['execution_time_seconds']:.2f}s)")
        
        # Recomendaciones generales
        recommendations.extend([
            "Configurar backups automáticos de MySQL",
            "Implementar monitoreo de rendimiento",
            "Revisar logs de errores de MySQL regularmente",
            "Configurar SSL para conexiones de producción"
        ])
        
        self.validation_results['recommendations'] = recommendations
        
        for i, rec in enumerate(recommendations, 1):
            self.log_validation(f"📋 Recomendación {i}: {rec}")

    def save_validation_report(self):
        """Guarda el reporte de validación"""
        report_path = f"validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            with open(report_path, 'w', encoding='utf-8') as file:
                json.dump(self.validation_results, file, indent=2, ensure_ascii=False)
            
            self.log_validation(f"📄 Reporte guardado en: {report_path}")
            
            # También crear reporte en texto plano
            text_report_path = report_path.replace('.json', '.txt')
            self.save_text_report(text_report_path)
            
        except Exception as e:
            self.log_validation(f"❌ Error guardando reporte: {str(e)}", "ERROR")

    def save_text_report(self, path):
        """Guarda reporte en formato texto"""
        try:
            with open(path, 'w', encoding='utf-8') as file:
                file.write("=" * 60 + "\n")
                file.write("      REPORTE DE VALIDACIÓN POST-MIGRACIÓN\n")
                file.write("=" * 60 + "\n\n")
                file.write(f"Fecha: {self.validation_results['timestamp']}\n")
                file.write(f"Conexión DB: {'✓ Exitosa' if self.validation_results['database_connection'] else '❌ Fallida'}\n\n")
                
                file.write("TABLAS VALIDADAS:\n")
                file.write("-" * 20 + "\n")
                for table in self.validation_results['tables_exist']:
                    file.write(f"✓ {table}\n")
                for table in self.validation_results['tables_missing']:
                    file.write(f"❌ {table} (faltante)\n")
                
                file.write("\nRENDIMIENTO:\n")
                file.write("-" * 12 + "\n")
                for test, metrics in self.validation_results['performance_metrics'].items():
                    status = "✓" if metrics['status'] == 'success' else "❌"
                    time_str = f"{metrics['execution_time_seconds']:.3f}s"
                    file.write(f"{status} {test}: {time_str}\n")
                
                file.write("\nRECOMENDACIONES:\n")
                file.write("-" * 16 + "\n")
                for i, rec in enumerate(self.validation_results['recommendations'], 1):
                    file.write(f"{i}. {rec}\n")
                
            self.log_validation(f"📄 Reporte de texto guardado en: {path}")
            
        except Exception as e:
            self.log_validation(f"❌ Error guardando reporte de texto: {str(e)}", "ERROR")

    def run_full_validation(self):
        """Ejecuta la validación completa"""
        self.log_validation("=== INICIANDO VALIDACIÓN POST-MIGRACIÓN ===", "INFO")
        
        # Ejecutar todas las validaciones
        connection_ok = self.test_database_connection()
        
        if connection_ok:
            self.validate_table_structure()
            self.validate_data_integrity()
            self.performance_test()
        else:
            self.log_validation("❌ No se puede continuar sin conexión a la base de datos", "ERROR")
        
        self.generate_recommendations()
        self.save_validation_report()
        
        # Resumen final
        tables_ok = len(self.validation_results['tables_exist'])
        tables_missing = len(self.validation_results['tables_missing'])
        
        self.log_validation("=== VALIDACIÓN COMPLETADA ===", "INFO")
        self.log_validation(f"📊 Resumen: {tables_ok} tablas OK, {tables_missing} faltantes")
        
        if connection_ok and tables_missing == 0:
            self.log_validation("🎉 ¡Migración validada exitosamente!", "INFO")
            return True
        else:
            self.log_validation("⚠️  Migración requiere atención", "WARNING")
            return False

def main():
    """Función principal"""
    print("🔍 === VALIDADOR DE MIGRACIÓN ETL ===")
    print("     Verificando integridad post-migración\n")
    
    validator = MigrationValidator()
    success = validator.run_full_validation()
    
    if success:
        print("\n✅ Validación exitosa. El sistema está listo para usar.")
    else:
        print("\n⚠️  Se encontraron problemas. Revisar reporte para detalles.")
    
    input("\nPresione Enter para continuar...")

if __name__ == "__main__":
    main()
