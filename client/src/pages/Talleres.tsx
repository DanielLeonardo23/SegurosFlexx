import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Pencil, Plus, Eye, ArrowLeft } from "lucide-react";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import Navbar from "../components/Navbar";

const API_TALLERES_URL =
  import.meta.env.VITE_API_TALLERES_URL || "http://localhost:4003/api/talleres";

const Talleres = () => {
  const [talleres, setTalleres] = useState<any[]>([]);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNoDeleteOpen, setModalNoDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [proveedoresModalOpen, setProveedoresModalOpen] = useState(false);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const navigate = useNavigate();

  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const talleresPorPagina = 10; // 10 registros por página

  useEffect(() => {
    fetchTalleres();
  }, []);

  const fetchTalleres = async () => {
    try {
      const response = await fetch(API_TALLERES_URL);
      const data = await response.json();
      setTalleres(data);
    } catch (error) {
      setAlert({ type: "error", message: "Error al obtener talleres" });
    }
  };

  const handleDelete = async (tallerId: number) => {
    try {
      const response = await fetch(`${API_TALLERES_URL}/${tallerId}`);
      const taller = await response.json();

      if (taller.estadoactual > 0) {
        setModalNoDeleteOpen(true);
        return;
      }

      setModalOpen(true);
      setSelectedId(tallerId);
    } catch (error) {
      setAlert({ type: "error", message: "Error al eliminar el taller" });
    }
  };

  /**
   * Si el usuario confirma la eliminación en el modal de confirmación.
   */
  const confirmDelete = async () => {
    try {
      if (selectedId) {
        await fetch(`${API_TALLERES_URL}/${selectedId}`, { method: "DELETE" });
        setAlert({ type: "success", message: "Taller eliminado correctamente" });
        fetchTalleres();
        setModalOpen(false);
      }
    } catch (error) {
      setAlert({ type: "error", message: "Error al eliminar el taller" });
    }
  };

  const handleVerProveedores = (proveedoresList: any[]) => {
    setProveedores(proveedoresList);
    setProveedoresModalOpen(true);
  };

  // Paginación:
  const totalPages = Math.ceil(talleres.length / talleresPorPagina);
  const indexOfLastTaller = currentPage * talleresPorPagina;
  const indexOfFirstTaller = indexOfLastTaller - talleresPorPagina;
  const currentTalleres = talleres.slice(indexOfFirstTaller, indexOfLastTaller);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <Navbar />
      <div className="p-8 min-h-screen bg-gradient-to-br from-white via-gray-100 to-blue-50 text-gray-900 pt-24">

        {/* Encabezado con Título, Botón "Regresar" y Botón "Agregar Taller" */}
        <div className="flex items-center justify-center mb-6 relative">
          {/* Botón "Regresar" a la izquierda */}
          <button
            onClick={() => navigate("/dashboard/admin")}
            className="absolute left-0 flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-lg shadow-md hover:bg-blue-600 transition"
          >
            <ArrowLeft size={18} />
            Regresar
          </button>

          {/* Título centrado */}
          <h1 className="text-4xl font-extrabold text-gray-800">🏭 Talleres</h1>

          {/* CONTENEDOR ALERTA Y BOTÓN AGREGAR TALLER */}
          <div className="absolute right-0 flex flex-col items-end gap-2">
            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}
            <button
              onClick={() => navigate("/registrar-taller")}
              className="flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-lg shadow-md hover:bg-blue-600 transition"
            >
              <Plus size={18} />
              Agregar Taller
            </button>
          </div>
        </div>

        {/* Tabla de Talleres */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <table className="w-full border border-gray-200 text-gray-800">
            <thead className="bg-gradient-to-r from-red-500 to-red-400 text-white uppercase text-sm tracking-wide">
              <tr>
                <th className="p-3 text-center">Nombre</th>
                <th className="p-3 text-center">Ubicación</th>
                <th className="p-3 text-center">Teléfono</th>
                <th className="p-3 text-center">Capacidad</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Proveedores</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentTalleres.map((taller: any) => (
                <tr
                  key={taller.tallerid}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-3 text-center">{taller.nombre}</td>
                  <td className="p-3 text-center">{taller.direccion}</td>
                  <td className="p-3 text-center">{taller.telefono}</td>
                  <td className="p-3 text-center">{taller.capacidad}</td>
                  <td className="p-3 text-center">{taller.estado}</td>
                  <td className="p-3 text-center min-w-[150px]">
                    {taller.proveedores && taller.proveedores.length > 0 ? (
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleVerProveedores(taller.proveedores)}
                          className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                          <Eye size={16} />
                          Ver Proveedores
                        </button>
                      </div>
                    ) : (
                      "Sin proveedores"
                    )}
                  </td>
                  <td className="p-3 flex justify-center gap-2">
                    <button
                      onClick={() => navigate(`/editar-taller/${taller.tallerid}`)}
                      className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(taller.tallerid)}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-red-600 transition"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginación */}
        <div className="flex justify-center mt-6 gap-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded-lg border ${
                currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Modal para ver proveedores */}
        {proveedoresModalOpen && (
          <Modal onClose={() => setProveedoresModalOpen(false)}>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Proveedores Asignados</h2>
              <div className="mt-4">
                {proveedores.length > 0 ? (
                  proveedores.map((proveedor) => (
                    <div key={proveedor.proveedor_id} className="p-2">
                      {proveedor.proveedor_nombre}
                    </div>
                  ))
                ) : (
                  <p>No hay proveedores asignados</p>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setProveedoresModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 px-5 py-2 rounded-lg text-white transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de confirmación de eliminación */}
        {modalOpen && (
          <Modal onClose={() => setModalOpen(false)}>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h2>
              <p className="mt-4">¿Estás seguro de que deseas eliminar este taller?</p>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg text-white transition"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 px-5 py-2 rounded-lg text-white transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal para notificar que no se puede eliminar por siniestros asignados */}
        {modalNoDeleteOpen && (
          <Modal onClose={() => setModalNoDeleteOpen(false)}>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Acción no permitida</h2>
              <p className="mt-4">
                No se puede eliminar este taller porque tiene siniestros asignados.
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setModalNoDeleteOpen(false)}
                  className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg text-white transition"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
};

export default Talleres;
