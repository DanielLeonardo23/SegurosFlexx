import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      console.warn('No se encontró ningún usuario en localStorage. Redirigiendo a login.');
      navigate('/');
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await apiClient.get<any>(`/api/beneficiarios/user/${user.UsuarioID}/role`);
        setUserRole(response.data.role);
      } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
      }
    };

    // Si no tiene rol, hacer la solicitud para obtener el rol
    if (!userRole) {
      fetchUserRole();
    } else {
      redirectBasedOnRole(userRole);
    }
  }, [user, userRole, navigate]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'Administrador':
        navigate('/dashboard/admin');
        break;
      case 'Personal':
        navigate('/dashboard/personal');
        break;
      default:
        navigate('/dashboard/general');
    }
  };

  return <div className="text-center text-white">Redirigiendo...</div>;
};

export default Dashboard;
