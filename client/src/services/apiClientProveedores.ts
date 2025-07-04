import axios from "axios";

// ✅ Definir la URL base para el backend de proveedores
const API_PROVEEDORES_URL = import.meta.env.VITE_API_PROVEEDORES_URL || "http://localhost:4003/api/proveedores";

const apiClientProveedores = axios.create({
  baseURL: API_PROVEEDORES_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // Límite de tiempo para solicitudes (10 segundos)
});

// ✅ Exportar la instancia de Axios para usarla en el frontend
export default apiClientProveedores;
