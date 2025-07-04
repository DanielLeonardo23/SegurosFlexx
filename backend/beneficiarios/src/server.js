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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Cargar variables de entorno desde .env
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../.env' });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db")); // Esto ejecutará la conexión automática con reintentos
const PORT = process.env.PORT || 3000;
// La conexión a la base de datos se maneja automáticamente en db.ts
// Aquí solo iniciamos el servidor
console.log(`🚀 Iniciando servidor en puerto ${PORT}...`);
app_1.default.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    // Opcional: mostrar tablas disponibles después de que la conexión esté establecida
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const client = yield db_1.default.connect();
            const result = yield client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            console.log("\n📊 Tablas disponibles en la base de datos:");
            result.rows.forEach((row) => {
                console.log(`  - ${row.table_name}`);
            });
            client.release();
        }
        catch (error) {
            console.log("ℹ️  Las tablas se mostrarán cuando la conexión esté establecida");
        }
    }), 2000); // Esperar 2 segundos para que la conexión esté lista
});
