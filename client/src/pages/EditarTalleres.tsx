import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import axios from "axios";

// IMPORTAMOS EL MODAL REUTILIZABLE
import Modal from "../components/Modal";

const API_TALLERES_URL =
  import.meta.env.VITE_API_TALLERES_URL || "http://localhost:4003/api/talleres";
const API_PROVEEDORES_URL =
  import.meta.env.VITE_API_PROVEEDORES_URL || "http://localhost:4003/api/proveedores";

const EditarTaller = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  interface AlertType {
    type: "success" | "error";
    message: string;
  }

  interface Proveedor {
    id_proveedor: number;
    nombre_proveedor: string;
    tipo_proveedor?: string; // Asegúrate de que exista en tu base de datos si vas a filtrar por tipo
  }

  interface Taller {
    nombre: string;
    direccion: string;
    capacidad: string;
    estado: string;
    telefono: string;
    proveedores?: {proveedor_id: number}[];
  }

  const [alert, setAlert] = useState<AlertType | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState<number[]>([]);

  // Estado del formulario (campos del taller)
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    capacidad: "",
    estado: "Disponible",
    telefono: "",
  });

  // Estados para controlar los modales
  const [isModalOpen, setIsModalOpen] = useState(false);         // Modal "Seleccionar proveedores"
  const [isSelectedModalOpen, setIsSelectedModalOpen] = useState(false); // Modal "Ver seleccionados"

  // Estados para el filtro por tipo de proveedor
  const [filterTipo, setFilterTipo] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Obtener proveedores
        const proveedoresResponse = await axios.get<Proveedor[]>(API_PROVEEDORES_URL);
        setProveedores(proveedoresResponse.data);

        // 2) Obtener los datos del taller a editar
        const tallerResponse = await axios.get<Taller>(`${API_TALLERES_URL}/${id}`);
        const data = tallerResponse.data;

        // Llenar el formulario con los datos del taller
        setForm({
          nombre: data.nombre || "",
          direccion: data.direccion || "",
          capacidad: data.capacidad || "",
          estado: data.estado || "Disponible",
          telefono: data.telefono || "",
        });

        // Marcar como seleccionados los proveedores que ya están asociados al taller
        if (data.proveedores && Array.isArray(data.proveedores)) {
          const proveedoresIds = data.proveedores.map((p: any) => p.proveedor_id);
          setProveedoresSeleccionados(proveedoresIds);
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
        setAlert({ type: "error", message: "Error al cargar los datos del taller" });
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Manejar cambios en campos del formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejar la selección de un proveedor
  const handleProveedorSeleccion = (id_proveedor: number) => {
    setProveedoresSeleccionados((prev) =>
      prev.includes(id_proveedor)
        ? prev.filter((pid) => pid !== id_proveedor)
        : [...prev, id_proveedor]
    );
  };

  // Al enviar el formulario, actualizar el taller
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.put(`${API_TALLERES_URL}/${id}`, {
        ...form,
        proveedores: proveedoresSeleccionados,
      });
      setAlert({ type: "success", message: "Taller actualizado correctamente" });
      setTimeout(() => navigate("/talleres"), 3000);
    } catch (error) {
      console.error("Error al actualizar el taller:", error);
      setAlert({ type: "error", message: "Error al actualizar el taller" });
    }
  };

  // 1) Crear array de tipos únicos (si usas tipo_proveedor en tu BD)
  const uniqueTipos = Array.from(new Set(proveedores.map((p) => p.tipo_proveedor)));

  // 2) Filtrar proveedores por tipo
  const filteredProveedores = filterTipo
    ? proveedores.filter((p) => p.tipo_proveedor === filterTipo)
    : proveedores;

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
            🛠️ Editar Taller
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Modifica los datos del taller.
          </p>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* Campo: Nombre */}
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Campo: Dirección */}
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Campo: Capacidad */}
            <div>
              <label className="block text-gray-700 font-semibold">Capacidad</label>
              <input
                type="number"
                name="capacidad"
                value={form.capacidad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Campo: Teléfono */}
            <div>
              <label className="block text-gray-700 font-semibold">Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Sección de Proveedores: dos botones (Seleccionar y Ver seleccionados) */}
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold">Proveedores</label>
              <div className="flex gap-4 mt-2">
                {/* Botón para abrir el modal de selección */}
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  onClick={() => setIsModalOpen(true)}
                >
                  Seleccionar proveedores
                </button>

                {/* Botón para abrir el modal de proveedores seleccionados */}
                <button
                  type="button"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                  onClick={() => setIsSelectedModalOpen(true)}
                >
                  Ver seleccionados
                </button>
              </div>
            </div>

            {/* Botón para guardar cambios (actualizar taller) */}
            <button
              type="submit"
              className="col-span-2 bg-red-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-red-600 transition flex items-center justify-center"
            >
              <CheckCircle size={18} className="mr-2" />
              Actualizar Taller
            </button>
          </form>
        </div>
      </div>

      {/* MODAL para SELECCIONAR proveedores (con filtro por tipo) */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Seleccionar Proveedores</h2>

            {/* Filtro por tipo de proveedor (opcional) */}
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
                {uniqueTipos.map((tipo, idx) => (
                  <option key={idx} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de proveedores filtrados */}
            <div className="mt-4 max-h-64 overflow-y-auto">
              {filteredProveedores.map((proveedor) => (
                <label key={proveedor.id_proveedor} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={proveedoresSeleccionados.includes(proveedor.id_proveedor)}
                    onChange={() => handleProveedorSeleccion(proveedor.id_proveedor)}
                  />
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

      {/* MODAL para VER proveedores seleccionados */}
      {isSelectedModalOpen && (
        <Modal onClose={() => setIsSelectedModalOpen(false)}>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Proveedores Seleccionados</h2>
            <div className="mt-4 max-h-64 overflow-y-auto">
              {proveedoresSeleccionados.length > 0 ? (
                <ul className="text-left">
                  {proveedoresSeleccionados.map((idProv) => {
                    const prov = proveedores.find((p) => p.id_proveedor === idProv);
                    return prov ? (
                      <li key={idProv} className="py-1">
                        {prov.nombre_proveedor}
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

export default EditarTaller;
