import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaEdit, FaCheck, FaTimes, FaLock } from "react-icons/fa";

interface Beneficiario {
  beneficiarioid: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  usuarioid: number;
}

const BeneficiarioPerfil = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [password, setPassword] = useState(""); // Nueva casilla para contraseña
  const [formData, setFormData] = useState<Partial<Beneficiario>>({});
  const [successMessage, setSuccessMessage] = useState("");  

  useEffect(() => {
    if (!user) {
      setError("No hay usuario autenticado");
      setLoading(false);
      return;
    }

    const fetchBeneficiarios = async () => {
      try {
        const response = await axios.get<Beneficiario[]>("http://localhost:4000/api/beneficiarios");
        const beneficiarios: Beneficiario[] = response.data;
        const beneficiarioEncontrado = beneficiarios.find((b) => b.usuarioid === user.UsuarioID);

        if (beneficiarioEncontrado) {
          setBeneficiario(beneficiarioEncontrado);
          setFormData(beneficiarioEncontrado);
        } else {
          setError("No se encontró un beneficiario asociado a este usuario");
        }
      } catch (error) {
        console.error("Error al obtener los beneficiarios:", error);
        setError("Error al cargar los datos del beneficiario");
      } finally {
        setLoading(false);
      }
    };

    fetchBeneficiarios();
  }, [user]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setPassword(""); // Limpiar campo de contraseña
    setFormData(beneficiario!);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfirmClick = async () => {
    if (!beneficiario) return;

    if (!password) {
      alert("Por favor, ingrese su contraseña para confirmar los cambios.");
      return;
    }

    const datosActualizados = {
      nombre: formData.nombre || beneficiario.nombre,
      apellido: formData.apellido || beneficiario.apellido,
      dni: formData.dni || beneficiario.dni,
      email: formData.email || beneficiario.email,
      telefono: formData.telefono || beneficiario.telefono,
      password, // Enviar contraseña para validación
    };

    try {
        const response = await axios.put<{message: string}>(
          `http://localhost:4000/api/beneficiarios/${beneficiario.beneficiarioid}`,
          datosActualizados,
          { headers: { "Content-Type": "application/json" } }
        );
      
        if (response.status === 200) {
          // ✅ Mostrar mensaje de éxito con una animación o estilo más claro
          setError(""); // Asegurar que no haya mensaje de error
          setLoading(false);
          setBeneficiario({ ...beneficiario, ...datosActualizados });
          setIsEditing(false);
          setPassword(""); 
      
          // ✅ Agregar un estado de éxito para mostrar en la UI
          setSuccessMessage("✅ Beneficiario actualizado correctamente.");
          setTimeout(() => setSuccessMessage(""), 3000); // Ocultar mensaje después de 3s
        }
      } catch (error) {
        console.error("Error al actualizar beneficiario:", error);
        setError("❌ No se pudo actualizar la información. Intente nuevamente.");
      }
  };

  if (loading) return <p className="text-center mt-10">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <>
      <Navbar />
      <div className="text-black max-w-7xl mx-auto p-8 bg-red-100 border border-red-300 rounded-lg items-center shadow-lg mt-15">
        {successMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md text-center mb-4">
            {successMessage}
        </div>
        )}
        <h1 className="text-4xl font-bold text-red-700 text-center mb-6">Perfil del Beneficiario</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Sección de Foto y Datos Generales */}
          <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center">
            <FaUser className="text-8xl text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">{beneficiario?.nombre} {beneficiario?.apellido}</h2>
            <p className="text-gray-500">Beneficiario</p>
            <p className="text-blue-600 font-bold text-lg">{beneficiario?.dni}</p>
          </div>

          {/* Sección de Información Personal */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
            <div className="space-y-3">

              {/* Campos: Nombre, Apellido, DNI, Email, Teléfono */}
              {[
                { label: "Nombre", icon: <FaUser />, key: "nombre" },
                { label: "Apellido", icon: <FaUser />, key: "apellido" },
                { label: "DNI", icon: <FaIdCard />, key: "dni" },
                { label: "Email", icon: <FaEnvelope />, key: "email" },
                { label: "Teléfono", icon: <FaPhone />, key: "telefono" },
              ].map((field) => (
                <div key={field.key} className="flex items-center space-x-3">
                  {field.icon}
                  {isEditing ? (
                    <input
                      type="text"
                      name={field.key}
                      value={formData[field.key as keyof Beneficiario] || ""}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-lg p-2 w-full"
                    />
                  ) : (
                    <p className="font-semibold">
                      {field.label}: {beneficiario?.[field.key as keyof Beneficiario]}
                    </p>
                  )}
                </div>
              ))}

              {/* Casilla de Contraseña (Solo Aparece en Modo Edición) */}
              {isEditing && (
                <div className="flex items-center space-x-3">
                  <FaLock />
                  <input
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 w-full"
                  />
                </div>
              )}

            </div>

            {/* Botones de Edición / Confirmación / Cancelación */}
            <div className="mt-4 flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <FaEdit /> <span>Editar</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleConfirmClick}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <FaCheck /> <span>Confirmar</span>
                  </button>
                  <button
                    onClick={handleCancelClick}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <FaTimes /> <span>Cancelar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center w-full mt-6">
        <button
          onClick={() => navigate("/dashboard/general")}
          className="bg-gray-600 text-white font-bold px-12 py-4 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-700"
        >
          Regresar al Dashboard
        </button>
        </div>       

      </div>
    </>

  );
};

export default BeneficiarioPerfil;
