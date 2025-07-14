// Cargar variables de entorno desde .env
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import app from "./app";
import pool from "./config/db"; // Esto ejecutará la conexión automática con reintentos

const PORT = process.env.PORT || 8080;

// La conexión a la base de datos se maneja automáticamente en db.ts
// Aquí solo iniciamos el servidor
console.log(`🚀 Iniciando servidor en puerto ${PORT}...`);

app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
  
  // Opcional: mostrar tablas disponibles después de que la conexión esté establecida
  setTimeout(async () => {
    try {
      const client = await pool.connect();
      const result = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      
      console.log("\n📊 Tablas disponibles en la base de datos:");
      result.rows.forEach((row: any) => {
        console.log(`  - ${row.table_name}`);
      });
      client.release();
    } catch (error) {
      console.log("ℹ️  Las tablas se mostrarán cuando la conexión esté establecida");
    }
  }, 2000); // Esperar 2 segundos para que la conexión esté lista
});

