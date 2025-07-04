import app from "./app";
import pool from "./config/db";

const PORT = process.env.PORT || 5002;

pool.connect()
  .then(async (client: any) => {
    console.log("Conectado a la base de datos PostgreSQL");

    // Consulta para obtener las tablas disponibles
    try {
      const result = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );

      console.log("Tablas disponibles en la base de datos:");
      result.rows.forEach((row: any) => {
        console.log(`- ${row.table_name}`); // Mostrar los nombres de las tablas
      });
    } catch (error) {
      console.error("Error al obtener las tablas:", error);
    } finally {
      client.release(); // Liberar la conexión al pool
    }

    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error("Error al conectar a la base de datos:", err);
  });

