import axios from "axios";

const API_URL = import.meta.env.VITE_API_RECLAMACION1_URL || "http://localhost:4000/api/reclamaciones";

// ✅ Obtener siniestros de un usuario
export const obtenerSiniestrosPorUsuario = async (usuarioID: number) => {
  try {
    const response = await axios.get<any>(`${API_URL}/siniestros/${usuarioID}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo siniestros:", error);
    return [];
  }
};

// ✅ Registrar una nueva reclamación con documentos (en una sola petición)
export const registrarReclamacion = async (formData: FormData) => {
  try {
    const response = await axios.post<any>(`${API_URL}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }, // Necesario para enviar archivos
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error registrando la reclamación:", error);
    throw error;
  }
};
