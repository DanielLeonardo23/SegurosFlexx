import axios from "axios";

// ✅ Definir la URL base para el backend de talleres
const API_TALLERES_URL = import.meta.env.VITE_API_TALLERES_URL || "http://localhost:4003/api/talleres";

const apiClientTalleres = axios.create({
  baseURL: API_TALLERES_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // Límite de tiempo para solicitudes (10 segundos)
});

// ✅ Exportar la instancia de Axios para usarla en el frontend
export default apiClientTalleres;
