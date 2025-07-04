import { useState } from 'react';
import { toast } from 'react-toastify'; // Asegúrate de importar toast
import apiClient from '../services/apiClient';

interface AuthResponse {
  user: {
    UsuarioID: number;
    Nombre: string;
    Apellido: string;
    Email: string;
  };
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);

  // Función de login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/api/beneficiarios/login', { Email: email, Password: password });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      toast.success('Inicio de sesión exitoso'); // Notificación de éxito
    } catch (error) {
      console.error('Error en inicio de sesión', error);
      toast.error('Credenciales incorrectas'); // Notificación de error
      throw new Error('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  // Función de registro para crear un beneficiario
  const register = async (userData: { Nombre: string; Apellido: string; Email: string; Password: string; ConfirmPassword: string; Telefono: string; DNI: string }) => {
    setLoading(true);
    try {
      const response = await apiClient.post<any>('/api/beneficiarios', userData); // Cambié la ruta a '/api/beneficiarios'

      if (response.data && response.data.message) {
        toast.success(response.data.message); // Usamos toast en lugar de alert
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
      } else {
        throw new Error('Error en el registro');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      toast.error('No se pudo registrar el usuario'); // Notificación de error
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (BeneficiarioID: number, TipoPoliza: string) => {
    try {
      const response = await apiClient.post('/api/polizas', { BeneficiarioID, TipoPoliza });
      toast.success('Póliza creada exitosamente'); // Usamos toast para el éxito
      return response.data;
    } catch (error) {
      console.error('Error al crear la póliza:', error);
      toast.error('No se pudo crear la póliza.'); // Notificación de error
    }
  };

  // Función para logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Has cerrado sesión'); // Notificación de información
  };

  return { login, register, createPolicy ,logout, loading, user };
};
