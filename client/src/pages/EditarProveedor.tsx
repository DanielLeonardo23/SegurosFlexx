import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, MapPin, Mail, Phone, User, Star, Trash} from "lucide-react";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar"; // Importar el Navbar
import axios from "axios";

interface Proveedor {
  nombre_proveedor: string;
  direccion: string;
  telefono_proveedor: string;
  correo_electronico: string;
  tipo_proveedor: string;
  estado_proveedor: string;
  valoracion: string;
  notas: string;
  documentos?: string[];
}

const API_PROVEEDORES_URL = import.meta.env.VITE_API_PROVEEDORES_URL || "http://localhost:4003/api/proveedores";

const EditarProveedor = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Usamos el ID para obtener el proveedor
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
    documentos: [] as File[], // Archivos nuevos
    documentos_existentes: [] as string[], // URLs de documentos existentes
  });

  // Obtener datos del proveedor
  useEffect(() => {
    const fetchProveedor = async () => {
      try {
        const response = await axios.get<Proveedor>(`${API_PROVEEDORES_URL}/${id}`);
        const data = response.data;

        setForm({
          ...form,
          nombre_proveedor: data.nombre_proveedor,
          direccion: data.direccion,
          telefono_proveedor: data.telefono_proveedor,
          correo_electronico: data.correo_electronico,
          tipo_proveedor: data.tipo_proveedor,
          estado_proveedor: data.estado_proveedor,
          valoracion: data.valoracion,
          notas: data.notas,
          documentos_existentes: data.documentos || [], // Cargar documentos existentes
        });
      } catch (error) {
        console.error("Error al obtener proveedor:", error);
        setAlert({ type: "error", message: "Error al cargar los datos del proveedor" });
      }
    };

    fetchProveedor();
  }, [id]);

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

  const handleDeleteDocument = (url: string) => {
    setForm((prevForm) => ({
      ...prevForm,
      documentos_existentes: prevForm.documentos_existentes.filter((doc) => doc !== url),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const imageUrls: string[] = [...form.documentos_existentes]; // Mantener los documentos existentes

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

    // Subir archivos nuevos
    try {
      for (let i = 0; i < form.documentos.length; i++) {
        const file = form.documentos[i];
        const fileFormData = new FormData();
        fileFormData.append("image", file);

        const response = await axios.post<{secure_url: string}>(
          "http://localhost:4003/upload", // URL del servidor para subir archivos
          fileFormData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const imageUrl = response.data.secure_url;
        imageUrls.push(imageUrl);
      }

      // Enviar el resto del formulario con las URLs de los archivos subidos
      await axios.put(`${API_PROVEEDORES_URL}/${id}`, {
        ...form,
        documentos: imageUrls,
      });

      setAlert({ type: "success", message: "Proveedor actualizado con éxito" });

      setTimeout(() => navigate("/proveedores"), 3000);
    } catch (error) {
      setAlert({ type: "error", message: "Error al actualizar el proveedor" });
      console.error("Error al actualizar el proveedor:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-red-100 via-red-200 to-red-300 text-gray-900 pt-24">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-4xl border border-red-300">
          <h1 className="text-4xl font-bold text-red-700 text-center mb-4">📝 Editar Proveedor</h1>
          <p className="text-gray-600 text-center mb-6">Modifica los datos del proveedor.</p>

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
              <label className="block text-gray-700 font-semibold">Valoración (0 - 10)</label>
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

<div className="col-span-2">
  <label className="block text-gray-700 font-semibold">Documentos Existentes</label>
  <div className="grid grid-cols-2 gap-4">
    {form.documentos_existentes.map((doc, index) => (
      <div key={index} className="relative">
        {doc.match(/\.(jpeg|jpg|png)$/) ? (
          <div className="flex items-center gap-2">
            <img src={doc} alt={`Documento ${index + 1}`} className="w-20 h-20 object-cover" />
            <button
              type="button"
              onClick={() => handleDeleteDocument(doc)}
              className="absolute top-0 right-0 text-red-500"
            >
              <Trash size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-500">
              Ver Documento
            </a>
            <button
              type="button"
              onClick={() => handleDeleteDocument(doc)}
              className="absolute top-0 right-0 text-red-500"
            >
              <Trash size={16} />
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
</div>


            {/* SELECCIONAR ARCHIVOS */}
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">Agregar Nuevos Documentos</label>
              <input
                type="file"
                name="documentos"
                multiple
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 bg-red-50"
              />
            </div>

            {/* BOTÓN ACTUALIZAR */}
            <button
              type="submit"
              className="col-span-2 bg-red-500 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Actualizar Proveedor
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

export default EditarProveedor;
