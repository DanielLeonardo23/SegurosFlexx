"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
// Configuración de PostgreSQL usando variables de entorno
const pool = new pg_1.Pool({
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
const connectWithRetry = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            yield pool.connect();
            console.log("✅ Conectado exitosamente a PostgreSQL");
            return;
        }
        catch (error) {
            const err = error;
            console.log(`❌ Intento ${i + 1}/${retries} falló. Error:`, err.message);
            if (i === retries - 1) {
                console.error("🔥 Error crítico: No se pudo conectar a PostgreSQL después de", retries, "intentos");
                throw err;
            }
            console.log(`⏳ Reintentando en ${delay / 1000} segundos...`);
            yield new Promise(resolve => setTimeout(resolve, delay));
        }
    }
});
// Manejar eventos del pool
pool.on('connect', (client) => {
    console.log('🔗 Nueva conexión establecida como id', client.processID);
});
pool.on('error', (err, client) => {
    console.error('🚨 Error inesperado en el cliente de PostgreSQL:', err);
});
// Iniciar conexión con reintentos
connectWithRetry().catch((err) => {
    console.error('💥 Fallo crítico en la conexión a la base de datos:', err);
});
exports.default = pool;
