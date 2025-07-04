import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, MapPin, Mail, Phone, User, Star } from "lucide-react";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar"; // Importar el Navbar
import axios from "axios"; // Asegúrate de importar axios

const API_PROVEEDORES_URL = import.meta.env.VITE_API_PROVEEDORES_URL || "http://localhost:4003/api/proveedores";

const RegistrarProveedor = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    nombre_proveedor: "",
    direccion: "",
    telefono_proveedor: "",
    correo_electronico: "",
    tipo_proveedor: "Distribuidor",
    estado_proveedor: "Activo",
    valoracion: "",
    notas: "",
    documentos: [] as File[], // Array de archivos
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejo de los archivos seleccionados
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setForm((prevForm) => ({
        ...prevForm,
        documentos: Array.from(selectedFiles), // Guardar los archivos seleccionados
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const imageUrls: string[] = [];
    // Crear un objeto FormData para enviar los archivos
    const formData = new FormData();
    formData.append("nombre_proveedor", form.nombre_proveedor);
    formData.append("direccion", form.direccion);
    formData.append("telefono_proveedor", form.telefono_proveedor);
    formData.append("correo_electronico", form.correo_electronico);
    formData.append("tipo_proveedor", form.tipo_proveedor);
    formData.append("estado_proveedor", form.estado_proveedor);
    formData.append("valoracion", form.valoracion);
    formData.append("notas", form.notas);
 
    // Subir archivos
    try {
     
      for (let i = 0; i < form.documentos.length; i++) {
        const file = form.documentos[i];

        const fileFormData = new FormData();
        fileFormData.append("image", file); // "image" es el campo que espera el backend

        const response = await axios.post<{secure_url: string}>(
          "http://localhost:4003/upload",  // URL del servidor para subir archivos
          fileFormData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const imageUrl = response.data.secure_url; // Obtener la URL segura del archivo subido
        imageUrls.push(imageUrl);
      }
 // Verificar que las URLs se han agregado al array
 console.log("URLs de los documentos:", imageUrls);
      // Enviar el resto del formulario con las URLs de los archivos subidos
      await axios.post(API_PROVEEDORES_URL, {
        ...form,
        documentos: imageUrls,  // Incluir las URLs de los archivos
      });

      setAlert({ type: "success", message: "Proveedor registrado con éxito" });

      setTimeout(() => navigate("/proveedores"), 3000); // Redirigir después de 3 segundos
    } catch (error) {
      setAlert({ type: "error", message: "Error al registrar el proveedor" });
      console.error("Error al registrar el proveedor:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-red-100 via-red-200 to-red-300 text-gray-900 pt-24">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-4xl border border-red-300">
          <h1 className="text-4xl font-bold text-red-700 text-center mb-4">📦 Registrar Proveedor</h1>
          <p className="text-gray-600 text-center mb-6">Completa los datos para añadir un nuevo proveedor.</p>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* NOMBRE */}
            <div>
              <label className="block text-gray-700 font-semibold">Nombre del Proveedor</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="nombre_proveedor"
                  placeholder="Proveedor Global S.A."
                  value={form.nombre_proveedor}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 bg-red-50"
                  required
                />
              </div>
            </div>

            {/* DIRECCIÓN */}
            <div>
              <label className="block text-gray-700 font-semibold">Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="direccion"
                  placeholder="Av. Principal 123, Lima"
                  value={form.direccion}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 bg-red-50"
                />
              </div>
            </div>

            {/* TELÉFONO */}
            <div>
              <label className="block text-gray-700 font-semibold">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  name="telefono_proveedor"
                  placeholder="+51 987 654 321"
                  value={form.telefono_proveedor}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 bg-red-50"
                />
              </div>
            </div>

            {/* CORREO ELECTRÓNICO */}
            <div>
              <label className="block text-gray-700 font-semibold">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  name="correo_electronico"
                  placeholder="contacto@proveedor.com"
                  value={form.correo_electronico}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 bg-red-50"
                  required
                />
              </div>
            </div>

          

            {/* TIPO DE PROVEEDOR */}
            <div>
              <label className="block text-gray-700 font-semibold">Tipo de Proveedor</label>
              <select
                name="tipo_proveedor"
                value={form.tipo_proveedor}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50"
              >
                <option value="Piezas y Componentes">Piezas y Componentes</option>
                <option value="Herramientas y Equipos">Herramientas y Equipos</option>
                <option value="Materiales Consumibles">Materiales Consumibles</option>
                <option value="Herramientas Especializadas">Herramientas Especializadas</option>
                <option value="Equipos de Diagnóstico y Tecnología">Equipos de Diagnóstico y Tecnología</option>
                <option value="Servicios de Desmontaje y Reciclaje">Servicios de Desmontaje y Reciclaje</option>
                <option value="Seguridad y Protección">Seguridad y Protección</option>
                <option value="Carrocería y Pintura">Carrocería y Pintura</option>
              </select>
            </div>

            {/* ESTADO DEL PROVEEDOR */}
            <div>
              <label className="block text-gray-700 font-semibold">Estado del Proveedor</label>
              <select
                name="estado_proveedor"
                value={form.estado_proveedor}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* VALORACIÓN */}
            <div>
              <label className="block text-gray-700 font-semibold">Valoración (0 - 9)</label>
              <div className="relative">
                <Star className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  name="valoracion"
                  placeholder="10"
                  min="0"
                  max="10"
                  value={form.valoracion}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 bg-red-50"
                />
              </div>
            </div>

            {/* NOTAS */}
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">Notas</label>
              <textarea
                name="notas"
                placeholder="Entrega rápida y atención personalizada"
                value={form.notas}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 bg-red-50"
                rows={3}
              />
            </div>
  {/* SELECCIONAR ARCHIVOS */}
  <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">Documentos</label>
              <input
                type="file"
                name="documentos"
                multiple
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 bg-red-50"
              />
            </div>
            {/* BOTÓN REGISTRAR */}
            <button
              type="submit"
              className="col-span-2 bg-red-500 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Registrar
            </button>
             {/* BOTÓN REGRESAR */}
             <button
              type="button"
              onClick={() => navigate("/proveedores")}
              className="col-span-2 mt-4 bg-gray-500 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:bg-gray-600 transition"
            >
              Regresar a Proveedores
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegistrarProveedor;
