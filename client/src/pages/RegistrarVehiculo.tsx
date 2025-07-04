import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { Car, Tag, ClipboardList, CheckCircle } from "lucide-react";
import Validation from '../components/Validation';
import { required, minLength, isValidPlate } from '../utils/validationRules';
import { useAuth } from '../context/AuthContext'; // Importamos el contexto de autenticación
import Layout from '../components/Layout';
import apiClient from '../services/apiClient';


const RegistrarVehiculo = () => {
  const [, setBeneficiarioID] = useState<number | null>(null);
  const { user } = useAuth(); //  Obtenemos el usuario autenticado
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    tipo: '',
    beneficiarioid: user?.UsuarioID || '', //  Se inicializa con el BeneficiarioID del usuario
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);


  const fetchBeneficiarioID = async () => {
    try {
      console.log("Obteniendo BeneficiarioID para UsuarioID:", user?.UsuarioID);
  
      const response = await apiClient.get<any>(`/api/beneficiarios/user/${user?.UsuarioID}/beneficiario`);
      console.log("Respuesta completa de la API:", response.data);
  
      // Verifica si la respuesta contiene el BeneficiarioID
      if (!response.data.BeneficiarioID) {  // <--- Usa la clave con mayúscula
        console.error(" No se recibió BeneficiarioID en la respuesta");
        return null;
      }
  
      setBeneficiarioID(response.data.BeneficiarioID);
      console.log(" BeneficiarioID obtenido:", response.data.BeneficiarioID);
      
      return response.data.BeneficiarioID;
    } catch (error) {
      console.error("Error al obtener BeneficiarioID:", error);
      setBeneficiarioID(null);
      return null;
    }
  };
  

  
  useEffect(() => {
    if (user?.UsuarioID ) {
      setFormData((prev) => ({ ...prev, beneficiarioid: user.UsuarioID  }));
    }
  }, [user]); // ✅ Si el usuario cambia, actualizamos el BeneficiarioID en el estado

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
  
    const b_id = await fetchBeneficiarioID();
    console.log("RegistrarVehiculo - BeneficiarioID obtenido:", b_id);
  
    if (!b_id) {
      toast.error("No se pudo obtener BeneficiarioID. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }
  
    // 🔹 Asegurarse de que `beneficiarioid` tiene el valor correcto
    const requestData = {
      ...formData,
      beneficiarioid: b_id,  // ✅ Usa `b_id` en lugar de `user.UsuarioID`
    };
  
    console.log("📤 Enviando datos al backend:", requestData);
  
    try {
      const response = await axios.post<any>("https://segurosflexbeneficiarios.onrender.com/api/vehiculo", requestData);
      setMessage(" Vehículo registrado exitosamente.");
      setFormData({
        placa: '',
        marca: '',
        modelo: '',
        tipo: '',
        beneficiarioid: b_id, // ✅ Mantener BeneficiarioID después de limpiar el form
      });
  
      toast.success(response.data.message);
    } catch (error) {
      console.error('❌ Error al registrar vehículo:', error);
      toast.error('Hubo un error en el registro. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
    <div className="flex justify-center min-h-screen w-full bg-gradient-to-r bg-white p-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg border border-red-300">
        <h2 className="text-4xl font-bold text-center text-red-700 mb-4">🚗 Registrar Vehículo</h2>
        <p className="text-gray-600 text-center mb-6">Completa los datos para registrar un nuevo vehículo.</p>

        {message && <div className="text-center p-2 rounded-lg bg-green-500 text-white">{message}</div>}

        {/* Placa */}
        <div>
          <label className="block text-gray-700 font-semibold">Placa</label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 text-gray-400" />
            <Validation value={formData.placa} rules={[required, isValidPlate, minLength(6)]}>
              {(error) => (
                <>
                  <input
                    name="placa"
                    type="text"
                    placeholder="ABC-123"
                    value={formData.placa}
                    onChange={handleChange}
                    className={`w-full pl-10 p-3 rounded-md border ${error ? 'border-red-500' : 'border-red-300'} bg-red-50 text-gray-900`}
                    required
                  />
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </>
              )}
            </Validation>
          </div>
        </div>

        {/* Marca */}
        <div>
          <label className="block text-gray-700 font-semibold">Marca</label>
          <div className="relative">
            <Car className="absolute left-3 top-3 text-gray-400" />
            <Validation value={formData.marca} rules={[required]}>
              {(error) => (
                <>
                  <input
                    name="marca"
                    type="text"
                    placeholder="Toyota, Nissan..."
                    value={formData.marca}
                    onChange={handleChange}
                    className={`w-full pl-10 p-3 rounded-md border ${error ? 'border-red-500' : 'border-red-300'} bg-red-50 text-gray-900`}
                    required
                  />
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </>
              )}
            </Validation>
          </div>
        </div>

        {/* Modelo */}
        <div>
          <label className="block text-gray-700 font-semibold">Modelo</label>
          <div className="relative">
            <ClipboardList className="absolute left-3 top-3 text-gray-400" />
            <Validation value={formData.modelo} rules={[required]}>
              {(error) => (
                <>
                  <input
                    name="modelo"
                    type="text"
                    placeholder="Corolla, Sentra..."
                    value={formData.modelo}
                    onChange={handleChange}
                    className={`w-full pl-10 p-3 rounded-md border ${error ? 'border-red-500' : 'border-red-300'} bg-red-50 text-gray-900`}
                    required
                  />
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </>
              )}
            </Validation>
          </div>
        </div>

        {/* Tipo de Vehículo */}
        <div>
          <label className="block text-gray-700 font-semibold">Tipo de Vehículo</label>
          <div className="relative">
            <Car className="absolute left-3 top-3 text-gray-400" />
            <Validation value={formData.tipo} rules={[required]}>
              {(error) => (
                <>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className={`w-full pl-10 p-3 rounded-md border ${error ? 'border-red-500' : 'border-red-300'} bg-red-50 text-gray-900`}
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    <option value="Sedán">Sedán</option>
                    <option value="SUV">SUV</option>
                    <option value="Camioneta">Camioneta</option>
                    <option value="Motocicleta">Motocicleta</option>
                    <option value="Pickup">Pickup</option>
                  </select>
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </>
              )}
            </Validation>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-red-500 p-3 rounded-md text-white font-semibold hover:bg-red-600 transition duration-300 flex items-center justify-center gap-2 mt-3"
          disabled={loading}
        >
          <CheckCircle size={18} />
          {loading ? 'Cargando...' : 'Registrar Vehículo'}
        </button>
      </form>

              

    </div>

   </Layout>
  );

  
};

export default RegistrarVehiculo;