import axios from 'axios';

// URL de la API


const API_RECLAMACION_URL = import.meta.env.VITE_API_RECLAMACION_URL || "http://localhost:4001/gestionreclamaciones";

// Obtener todas las reclamaciones
export const obtenerReclamaciones = async () => {
  try {
    const response = await axios.get<any>(API_RECLAMACION_URL);
    return response.data;  // Devuelve los datos de las reclamaciones
  } catch (error) {
    console.error('Error al obtener las reclamaciones', error);
    throw error; // Lanza el error para manejarlo en el componente
  }
};

// Obtener detalles de una reclama
export const obtenerDetallesReclamacion = async (reclamacionid: string) => {
  try {
    const response = await axios.get<any>(`${API_RECLAMACION_URL}/${reclamacionid}/detalles`);
    return response.data;  // Devuelve los detalles de la reclamación
  } catch (error) {
    console.error('Error al obtener los detalles de la reclamación', error);
    throw error;  // Lanza el error para manejarlo en el componente
  }
};

// Actualizar el estado de una reclamación
export const actualizarEstadoReclamacion = async (reclamacionid: string, estado: string) => {
  try {
    const response = await axios.put<any>(`${API_RECLAMACION_URL}/${reclamacionid}/estado`, { estado });
    return response.data;  // Devuelve el mensaje de éxito
  } catch (error) {
    console.error('Error al actualizar el estado de la reclamación', error);
    throw error;  // Lanza el error para manejarlo en el componente
  }

  
};

export const eliminarReclamacion = async (reclamacionid: string) => {
  try {
    const response = await axios.delete<any>(`${API_RECLAMACION_URL}/${reclamacionid}`);
    return response.data;  // Devuelve el mensaje de éxito
  } catch (error) {
    console.error('Error al eliminar la reclamación', error);
    throw error;  // Lanza el error para manejarlo en el componente
  }
}

export const validarDocumentos = async (reclamacionid: string) => {
  try {
    const response = await axios.post<any>(
      `${API_RECLAMACION_URL}/gestionreclamaciones/${reclamacionid}/validar-documentos`
    );
    return response.data;  // Devuelve el resultado de la validación de todos los documentos
  } catch (error) {
    console.error("Error al validar los documentos de la reclamación", error);
    throw error;  // Lanza el error para manejarlo en el componente
  }
};



