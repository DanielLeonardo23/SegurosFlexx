#!/usr/bin/env python3
"""
ETL Test Script - Ejecución automática para pruebas
"""

import os
import sys

# Agregar la ruta actual al path para importar el módulo
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from etl_postgres_to_mysql import PostgreSQLToMySQLETL

def test_etl():
    """Función de prueba del ETL"""
    print("=== PRUEBA AUTOMÁTICA DEL ETL ===")
    
    # Configuración automática
    postgres_dump_path = r"C:\Users\John\Downloads\seguros_2025-02-27_120833.sql"
    mysql_output_path = "segurosflex_mysql_test.sql"
    
    # Verificar archivo fuente
    if not os.path.exists(postgres_dump_path):
        print(f"❌ ERROR: No se encuentra el archivo {postgres_dump_path}")
        return False
    
    print(f"📂 Archivo fuente: {postgres_dump_path}")
    print(f"📄 Archivo destino: {mysql_output_path}")
    
    # Crear instancia ETL
    etl = PostgreSQLToMySQLETL(postgres_dump_path, mysql_output_path)
    
    # Ejecutar conversión
    try:
        if etl.process_conversion():
            print(f"\n✅ ¡Conversión completada exitosamente!")
            print(f"📄 Script MySQL generado: {mysql_output_path}")
            
            # Verificar que el archivo se creó
            if os.path.exists(mysql_output_path):
                file_size = os.path.getsize(mysql_output_path)
                print(f"📊 Tamaño del archivo generado: {file_size} bytes")
                
                # Mostrar las primeras líneas del archivo generado
                print(f"\n📋 Primeras líneas del script MySQL:")
                print("-" * 50)
                with open(mysql_output_path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f):
                        if i >= 10:  # Mostrar solo las primeras 10 líneas
                            break
                        print(f"{i+1:2d}: {line.rstrip()}")
                print("-" * 50)
                
                # Guardar log
                etl.save_conversion_log()
                return True
            else:
                print("❌ Error: El archivo de salida no se creó")
                return False
        else:
            print("❌ Error en la conversión")
            return False
            
    except Exception as e:
        print(f"❌ Error ejecutando ETL: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_etl()
    print("\n" + "=" * 50)
    if success:
        print("🎉 PRUEBA ETL EXITOSA")
    else:
        print("💥 PRUEBA ETL FALLIDA")
    print("=" * 50)
