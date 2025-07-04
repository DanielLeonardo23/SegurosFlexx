import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import cloudinary from "cloudinary";
import siniestrosRoutes from "./routes/siniestrosRoutes";
import beneficiariosRoutes from "./routes/beneficiariosRoutes";
import polizasRoutes from "./routes/polizaRoutes";
import reclamacionRoutes from "./routes/reclamacionRoutes"; // ✅ Agregar las rutas de reclamación
import pagosRoutes from "./routes/pagosRoutes"; // ✅ Agregar las rutas de pagos
import seguimientoRoutes from "./routes/seguimientoRoutes"; // Importa las rutas de seguimiento
import vehiculoRoute from "./routes/vehiculoRoute"; 

// Configurar variables de entorno
dotenv.config();

// Crear aplicación
const app = express();

// Middlewares
const corsOptions = {
  origin: [
    'https://seguros-flex.vercel.app', // Frontend desplegado
    'http://localhost:3000',           // Frontend local
    'http://localhost:5173',           // Vite dev server
    'http://127.0.0.1:3000',          // Alternativa localhost
    'http://127.0.0.1:5173'           // Alternativa localhost Vite
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200 // Para soportar navegadores legacy
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Agregar Rutas de la API
app.use("/api/beneficiarios", beneficiariosRoutes);
app.use("/api/siniestros", siniestrosRoutes);
app.use("/api/polizas", polizasRoutes);
app.use("/api/reclamaciones", reclamacionRoutes);
app.use('/api/pagos', pagosRoutes);
app.use("/api/seguimiento", seguimientoRoutes);
app.use('/api/vehiculo', vehiculoRoute);


// ✅ Ruta para cargar imágenes a Cloudinary (SOLO para siniestros)
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const mimeType = allowedTypes.test(file.mimetype);

  if (mimeType) {
    cb(null, true); // Aceptar el archivo
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo imágenes y PDFs."), false); // Rechazar el archivo
  }
};

const upload = multer({
  dest: "uploads/", // Directorio temporal
  fileFilter: fileFilter,
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.post("/upload", upload.single("image"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).send("No file uploaded.");
      return;
    }

    // Subir el archivo a Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: "Siniestros",
    });

    // Enviar la URL del archivo subido a Cloudinary como respuesta
    res.status(200).json(result);
  } catch (error) {
    res.status(400).send("Error al cargar el archivo.");
  }
});


export default app;
