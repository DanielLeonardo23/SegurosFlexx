import axios from 'axios';

// Configuración base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/';
console.log("API_URL:", import.meta.env.VITE_API_URL);
console.log("Usando API_URL:", API_URL);


// Crear la instancia de Axios con configuraciones predeterminadas
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Tiempo límite para solicitudes (10 segundos)
});

// Interceptor para adjuntar el token de autenticación a cada solicitud
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Error en la configuración de la solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores globales
apiClient.interceptors.response.use(
  (response) => response, // Pasar la respuesta si no hay errores
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.warn('No autorizado. Redirigiendo al login...');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login'; // Redirigir al login
      } else if (status === 403) {
        console.error('Acceso prohibido.');
      } else if (status >= 500) {
        console.error('Error en el servidor. Intente más tarde.');
      }
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor. Verifique su conexión.');
    } else {
      console.error('Error desconocido:', error.message);
    }
    return Promise.reject(error);
  }
  
);


export default apiClient;
