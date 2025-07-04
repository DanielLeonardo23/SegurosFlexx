import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import axios from "axios";
import Modal from "../components/Modal"; // Reutilizamos el componente Modal con el mismo estilo

const API_TALLERES_URL = import.meta.env.VITE_API_TALLERES_URL || "http://localhost:4003/api/talleres";
const API_PROVEEDORES_URL = import.meta.env.VITE_API_PROVEEDORES_URL || "http://localhost:4003/api/proveedores";

const RegistrarTaller = () => {
  const navigate = useNavigate();
  
  interface AlertType {
    type: "success" | "error";
    message: string;
  }

  interface Proveedor {
    id_proveedor: number;
    nombre_proveedor: string;
    tipo_proveedor: string;
  }

  const [alert, setAlert] = useState<AlertType | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState<number[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    capacidad: "",
    telefono: ""
  });

  // Estados para controlar la visibilidad de los modales:
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectedModalOpen, setIsSelectedModalOpen] = useState(false);
  
  // Estado para el filtro de tipo de proveedor
  const [filterTipo, setFilterTipo] = useState("");

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await axios.get<Proveedor[]>(API_PROVEEDORES_URL);
        setProveedores(response.data);
      } catch (error) {
        console.error("Error al obtener proveedores", error);
      }
    };
    fetchProveedores();
  }, []);

  // Generamos un array con los tipos únicos
  const uniqueTipos = Array.from(new Set(proveedores.map((p) => p.tipo_proveedor)));

  // Filtramos los proveedores según el tipo seleccionado
  const filteredProveedores = filterTipo
    ? proveedores.filter((p) => p.tipo_proveedor === filterTipo)
    : proveedores;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProveedorChange = (id: number) => {
    setProveedoresSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const dataToSend = { ...form, proveedores: proveedoresSeleccionados };
      await axios.post(API_TALLERES_URL, dataToSend);
      setAlert({ type: "success", message: "Taller creado correctamente" });
      setTimeout(() => navigate("/talleres"), 3000);
    } catch (error) {
      setAlert({ type: "error", message: "Error al crear el taller" });
      console.error("Error al crear el taller:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-red-100 via-red-200 to-red-300 text-gray-900 pt-24">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}
        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-4xl border border-blue-300">
          <h1 className="text-4xl font-bold text-red-700 text-center mb-4">
            🛠️ Registrar Taller
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Completa los datos para añadir un nuevo taller.
          </p>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">
                Nombre del Taller
              </label>
              <input
                type="text"
                name="nombre"
                placeholder="Taller Mecánico ABC"
                value={form.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg bg-red-50"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                placeholder="Av. Principal 123, Ciudad"
                value={form.direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg bg-red-50"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold">
                Capacidad
              </label>
              <input
                type="number"
                name="capacidad"
                placeholder="50"
                min="1"
                value={form.capacidad}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg bg-red-50"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                placeholder="+51 987 654 321"
                value={form.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg bg-red-50"
                required
              />
            </div>
            {/* Sección de Proveedores con dos botones en fila */}
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">
                Proveedores
              </label>
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  onClick={() => setIsModalOpen(true)}
                >
                  Seleccionar proveedores
                </button>
                <button
                  type="button"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                  onClick={() => setIsSelectedModalOpen(true)}
                >
                  Ver seleccionados
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="col-span-2 bg-red-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Registrar
            </button>
          </form>
        </div>
      </div>

      {/* Modal para seleccionar proveedores con filtro */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Seleccionar Proveedores</h2>
            {/* Filtro por tipo de proveedor */}
            <div className="mt-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Filtrar por Tipo:
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Todos</option>
                {uniqueTipos.map((tipo, index) => (
                  <option key={index} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            {/* Lista de proveedores filtrados */}
            <div className="mt-4 max-h-64 overflow-y-auto">
              {filteredProveedores.map((proveedor) => (
                <label
                  key={proveedor.id_proveedor}
                  className="flex items-center gap-2 py-1"
                >
                  <input
                    type="checkbox"
                    checked={proveedoresSeleccionados.includes(proveedor.id_proveedor)}
                    onChange={() => handleProveedorChange(proveedor.id_proveedor)}
                  />
                  {/* Solo se muestra el nombre del proveedor */}
                  {proveedor.nombre_proveedor}
                </label>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg text-white transition"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal para ver proveedores seleccionados */}
      {isSelectedModalOpen && (
        <Modal onClose={() => setIsSelectedModalOpen(false)}>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Proveedores Seleccionados</h2>
            <div className="mt-4 max-h-64 overflow-y-auto">
              {proveedoresSeleccionados.length > 0 ? (
                <ul className="text-left">
                  {proveedoresSeleccionados.map((id) => {
                    const proveedor = proveedores.find((p) => p.id_proveedor === id);
                    return proveedor ? (
                      <li key={id} className="py-1">
                        {/* Solo se muestra el nombre del proveedor */}
                        {proveedor.nombre_proveedor}
                      </li>
                    ) : null;
                  })}
                </ul>
              ) : (
                <p>No se han seleccionado proveedores</p>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setIsSelectedModalOpen(false)}
                className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg text-white transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default RegistrarTaller;
