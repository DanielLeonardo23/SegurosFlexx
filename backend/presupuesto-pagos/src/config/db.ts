import { Pool } from "pg";

// Configuración de PostgreSQL usando variables de entorno
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'segurosflex',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
  ssl: false, // Sin SSL para conexión local
  max: 10, // máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo de espera para conexiones inactivas
  connectionTimeoutMillis: 10000, // tiempo de espera para establecer conexión (10s)
});

// Función para intentar conectar con reintentos
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.connect();
      console.log("✅ Conectado exitosamente a PostgreSQL");
      return;
    } catch (error) {
      const err = error as Error;
      console.log(`❌ Intento ${i + 1}/${retries} falló. Error:`, err.message);
      if (i === retries - 1) {
        console.error("🔥 Error crítico: No se pudo conectar a PostgreSQL después de", retries, "intentos");
        throw err;
      }
      console.log(`⏳ Reintentando en ${delay/1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Manejar eventos del pool
pool.on('connect', (client: any) => {
  console.log('🔗 Nueva conexión establecida como id', client.processID);
});

pool.on('error', (err: any, client: any) => {
  console.error('🚨 Error inesperado en el cliente de PostgreSQL:', err);
});

// Iniciar conexión con reintentos
connectWithRetry().catch((err) => {
  console.error('💥 Fallo crítico en la conexión a la base de datos:', err);
});

export default pool;
