import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    'https://seguros-flex.vercel.app', // Frontend desplegado
    'http://localhost:3000',           // Frontend local
    'http://localhost:5173',           // Vite dev server
    'http://127.0.0.1:3000',          // Alternativa localhost
    'http://127.0.0.1:5173'           // Alternativa localhost Vite
  ],
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Microservicio de seguridad corriendo en el puerto ${PORT}`));
