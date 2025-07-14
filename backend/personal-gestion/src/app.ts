import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import GestionReclamacionesRoutes from "./routes/gestionReclmacionesRoutes"; // Importa las rutas de gestion de reclamaciones

// Configurar variables de entorno
dotenv.config();

// Crear aplicación
const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Registrar rutas
app.use("/gestionreclamaciones", GestionReclamacionesRoutes);

// Imprimir rutas registradas en el servidor
console.log("Rutas registradas en el servidor:");
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log(`- ${middleware.route.path}`);
  }
});

// Middleware de manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Middleware de error global:", err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

export default app;
