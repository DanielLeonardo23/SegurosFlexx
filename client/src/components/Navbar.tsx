import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import apiClient from '../services/apiClient';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<number>(0); // Cantidad de notificaciones
  const [missingPoliza, setMissingPoliza] = useState(false); // Indica si falta una póliza
  const [missingVehiculo, setMissingVehiculo] = useState(false); // Indica si falta un vehículo
  const [showDropdown, setShowDropdown] = useState(false);
  const [, setBeneficiarioID] = useState<number | null>(null);

  const handleLogout = () => {
    console.log("logout");
    logout();
    navigate("/");
  };
  console.log("inicio");
  
  // Función para obtener el BeneficiarioID si el rol es Beneficiario
  const fetchBeneficiarioID = async () => {
    try {
      console.log("fetchBeneficiarioID");
      console.log(userRole);
      if (userRole !== "Beneficiario") return null; // Solo ejecutamos si el usuario es beneficiario
      console.log("api beneficiario id");
      console.log("user");
      console.log(user?.UsuarioID);
      const response = await apiClient.get<any>(`/api/beneficiarios/user/${user?.UsuarioID}/beneficiario`);
      setBeneficiarioID(response.data.BeneficiarioID);
      console.log(" BeneficiarioID obtenido:", response.data.BeneficiarioID);
      console.log(" fin responde.data")  
      return response.data.BeneficiarioID; //  Ahora retorna el BeneficiarioID
    } catch (error) {
      console.error(" Error al obtener BeneficiarioID:", error);
      setBeneficiarioID(null);
      return null; //  Retornar null en caso de error
    }
  };

  const fetchUserRole = async () => {
    try {
      console.log("fecthUserRole");
      const response = await apiClient.get<any>(`/api/beneficiarios/user/${user?.UsuarioID}/role`);
      setUserRole(response.data.role);
      console.log(response.data.role);
      console.log("fin fecthUserRole");
      return response.data.role; // Devolvemos el rol para usarlo después
    } catch (error) {
      console.error(" Error al obtener el rol del usuario:", error);
      return null; // En caso de error, devolvemos null
    }
  };

  useEffect(() => {
    console.log("----------------------useEffect - Obtener userRole---------------");
    if (!user) return;
  
    const fetchData = async () => {
      console.log("user fecth data:", user);
      
      //  Obtener el rol del usuario
      const role = await fetchUserRole();
      if (!role) return; // Si no hay rol, detenemos la ejecución
  
      console.log("Role obtenido:", role);
      setUserRole(role); // Guardamos el userRole en el estado
    };
  
    fetchData();
  }, [user]); // Solo se ejecuta cuando cambia `user`
  
  // 🚀 Nuevo useEffect para obtener BeneficiarioID después de obtener el rol
  useEffect(() => {
    console.log("----------------------useEffect - Obtener BeneficiarioID---------------");
    if (userRole !== "Beneficiario") return;
  
    const fetchBeneficiario = async () => {
      console.log("Dentro de beneficiario useEffect");
  
      const b_id = await fetchBeneficiarioID();
      console.log("BeneficiarioID obtenido:", b_id);
      if (!b_id) return; // Si no obtenemos un BeneficiarioID, no seguimos
  
      // 🔹 Ahora usamos `b_id` correctamente en las solicitudes
      const polizaRes = await apiClient.get<any>(`/api/beneficiarios/${b_id}/check-poliza`);
      setMissingPoliza(!polizaRes.data.hasPoliza);
      console.log(" Respuesta check-poliza:", polizaRes.data);
  
      const vehiculoRes = await apiClient.get<any>(`/api/beneficiarios/${b_id}/check-vehiculo`);
      setMissingVehiculo(!vehiculoRes.data.hasVehiculo);
      console.log(" Respuesta check-vehiculo:", vehiculoRes.data);
  
      // Calcular cantidad de notificaciones
      let count = 0;
      if (!polizaRes.data.hasPoliza) count++;
      if (!vehiculoRes.data.hasVehiculo) count++;
      setNotifications(count);
      console.log(" Notificaciones calculadas:", count);
    };
  
    fetchBeneficiario();
  }, [userRole]); // Este se ejecuta solo cuando `userRole` cambia

  const handleNotificationClick = () => {
    console.log(` Click en notificación. Poliza: ${missingPoliza}, Vehículo: ${missingVehiculo}`);
    setShowDropdown(!showDropdown); // Toggle para abrir/cerrar el dropdown
  };

  return (
    <nav className="w-full h-20 bg-gray-900 text-white shadow-lg px-6 flex justify-between items-center fixed top-0 z-50">
      {/* Logo */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
        <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
          Seguro<span className="text-red-300">Flex</span>
        </span>
      </h1>

      {/* Botón de Perfil */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-white font-semibold transition shadow-lg"
        >
          Ver Perfil
        </button>

        {/*  Notificación con la cantidad de elementos faltantes */}
        {userRole === 'Beneficiario' && notifications > 0 && (
          <div className="relative">
            {/* Botón de la campana */}
            <button
              onClick={handleNotificationClick}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold transition shadow-lg"
            >
              Notificaciones ({notifications})
            </button>

            {/* Dropdown de notificaciones */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Notificaciones</h3>

                {missingPoliza && (
                  <button
                    onClick={() => navigate('/dashboard/general/polizas')}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg mb-2 transition"
                  >
                    Falta elegir una Póliza
                  </button>
                )}

                {missingVehiculo && (
                  <button
                    onClick={() => navigate('/dashboard/general/vehiculo')}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Falta registrar un Vehículo
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showProfile && (
          <Modal onClose={() => setShowProfile(false)}>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 w-96 max-w-full">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b pb-2 text-center uppercase tracking-wide flex items-center justify-center gap-3">
                <i className="fas fa-user-circle text-red-600 text-2xl"></i> Perfil de Usuario
              </h2>
              <div className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-300 space-y-3">
                <p className="text-gray-900"><span className="font-semibold text-red-700">Nombre:</span> {user?.Nombre} {user?.Apellido}</p>
                <p className="text-gray-900"><span className="font-semibold text-red-700">Correo:</span> {user?.Email}</p>
                <p className="text-gray-900"><span className="font-semibold text-red-700">Rol:</span> {userRole}</p>
              </div>
              <button onClick={handleLogout} className="mt-6 w-full bg-gray-900 hover:bg-gray-700 px-4 py-3 rounded-lg text-white font-medium">Cerrar sesión</button>
            </div>
          </Modal>
        )}
      </div>
    </nav>
  );
};

export default Navbar;