import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
// Endpoint del backend para indemnizaciones
const API_INDEMNIZACIONES_URL =
  import.meta.env.VITE_API_INDEMNIZACIONES_URL || "http://localhost:4002/api/indemnizaciones/";
const Indemnizaciones = () => {
  interface Indemnizacion {
    siniestroid: number;
    fecha_siniestro: string;
    montototal: number;
    estado: string;
    presupuestoid: number;
  }
  const [indemnizaciones, setIndemnizaciones] = useState<Indemnizacion[]>([]);
  const [filteredIndemnizaciones, setFilteredIndemnizaciones] = useState<Indemnizacion[]>([]);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("siniestroid");
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handlePagar = (presupuestoid: number) => {
    setModalMessage(null); // Limpia el mensaje anterior
    setSelectedPresupuesto(presupuestoid);
    setShowModal(true);
  };


  const confirmPagar = async () => {
    if (!selectedPresupuesto) return;
    setLoading(true);

    try {
      // Ejecutamos la petición PATCH y a la vez esperamos 1 segundo
      const [response] = await Promise.all([
        fetch(`${API_INDEMNIZACIONES_URL}/${selectedPresupuesto}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }),
        new Promise((resolve) => setTimeout(resolve, 1000)), // espera de 1 segundo
      ]);
      const data = await response.json();
      setModalMessage(data.message);
      fetchIndemnizaciones(); // Actualiza la tabla
    } catch (error) {
      setModalMessage("Error al procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndemnizaciones();
  }, []);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    filterAndSort();
  }, [search, searchField, sortField, sortOrder, indemnizaciones, filtro]);

  const fetchIndemnizaciones = async () => {
    try {
      const response = await fetch(API_INDEMNIZACIONES_URL);
      const data = await response.json();
      setIndemnizaciones(data);
      setFilteredIndemnizaciones(data);
    } catch (error) {
      setAlert({ type: "error", message: "Error al obtener indemnizaciones" });
    }
  };

  const parseSiniestroId = (val: any) => {
    if (!val) return 0;
    const strVal = val.toString().toUpperCase();
    if (strVal.startsWith("SIN-")) {
      return parseInt(strVal.substring(4), 10) || 0;
    }
    return parseInt(strVal, 10) || 0;
  };

  const filterAndSort = () => {
    let filtered = indemnizaciones.filter((item) => {
      let value = item[searchField as keyof Indemnizacion];
      if (searchField === "fecha_siniestro" && value) {
        value = new Date(value as string).toLocaleDateString() as unknown as never;
      }
  
      if (searchField === "siniestroid") {
        if (search.length < 3) {
          return true;
        } else {
          if (search.length < 5) {
            const substring = search.substring(0, search.length + 1);
            if (substring === "SIN" || substring === "SIN-") {
              return true;
            }
          } else {
            const substring = search.substring(0, 4);
            if (substring === "SIN-") {
              const searchNum = search.substring(4);
              const idNum = item.siniestroid.toString();
              return idNum.startsWith(searchNum);
            } else {
              return false;
            }
          }
        }
      }
      return value?.toString().toLowerCase().includes(search.toLowerCase());
    });
  
    // Filtrar según el valor del desplegable (filtro)
    filtered = filtered.filter((item) => {
      console.log(filtro);
      if (filtro === "pagados") return item.estado.toLowerCase().trim() === "pagado";
      if (filtro === "porPagar") return item.estado.toLowerCase().trim() !== "pagado";
      return true; // "todos"
      
    });
  
    if (sortField) {
      filtered.sort((a, b) => {
        let valA: any = a[sortField as keyof Indemnizacion];
        let valB: any = b[sortField as keyof Indemnizacion];
  
        if (sortField === "siniestroid") {
          valA = parseSiniestroId(valA);
          valB = parseSiniestroId(valB);
        } else if (sortField === "fecha_siniestro") {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else {
          const strA = valA ? valA.toString().toLowerCase() : "";
          const strB = valB ? valB.toString().toLowerCase() : "";
          valA = strA;
          valB = strB;
        }
  
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
  
    setFilteredIndemnizaciones(filtered);
    setCurrentPage(1);
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const totalPages = Math.ceil(filteredIndemnizaciones.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIndemnizaciones.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  const selectedIndemnizacion = indemnizaciones.find(
    (item) => item.presupuestoid === selectedPresupuesto
  );
  return (
    <>
      <Navbar />
      <div className="p-8 min-h-screen bg-gradient-to-br from-white via-gray-100 to-red-50 text-gray-900 pt-24">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}
        <div className="flex items-center justify-between mb-6">
          <button
            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-blue-600 transition"
            onClick={() => navigate("/dashboard/admin")}
          >
            <ArrowLeft size={18} />
            Regresar
          </button>
          <h1 className="text-4xl font-extrabold text-gray-800 text-center flex-1">
            📋 GESTIONAR PAGOS DE INDEMNIZACION
          </h1>
        </div>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar indemnización..."
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="p-3 border border-gray-300 rounded-lg"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="siniestroid">ID SINIESTRO</option>
            <option value="fecha_siniestro">FECHA DEL SINIESTRO</option>
            <option value="montototal">MONTO DE INDEMNIZACION</option>
            <option value="estado">ESTADO DEL PAGO</option>
          </select>
          {/* Nuevo desplegable de filtro */}
          <select
            className="p-3 border border-gray-300 rounded-lg"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="todos">MOSTRAR TODOS</option>
            <option value="pagados">MOSTRAR SOLO PAGADOS</option>
            <option value="porPagar">MOSTRAR SOLO POR PAGAR</option>
          </select>
          <select
            className="p-3 border border-gray-300 rounded-lg"
            value={sortField || ""}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="">ORDENAR POR...</option>
            <option value="siniestroid">ID SINIESTRO</option>
            <option value="fecha_siniestro">FECHA DEL SINIESTRO</option>
            <option value="montototal">MONTO DE INDEMNIZACION</option>
            <option value="estado">ESTADO DEL PAGO</option>
          </select>
          <button
            className="flex items-center gap-1 bg-white text-black border border-gray-300 px-3 py-2 rounded-lg shadow-md hover:bg-gray-200 transition"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            ↑↓
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-xl p-6">
          <table className="w-full border border-gray-200 text-gray-800">
            <thead className="bg-gradient-to-r from-red-500 to-red-400 text-white uppercase text-sm tracking-wide">
              <tr>
                <th className="p-3 text-center">ID SINIESTRO</th>
                <th className="p-3 text-center">FECHA DEL SINIESTRO</th>
                <th className="p-3 text-center">MONTO DE INDEMNIZACION</th>
                <th className="p-3 text-center">ESTADO DEL PAGO</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.presupuestoid} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3 text-center">{"SIN-" + item.siniestroid}</td>
                  <td className="p-3 text-center">
                    {item.fecha_siniestro
                      ? new Date(item.fecha_siniestro).toLocaleDateString()
                      : "No asignada"}
                  </td>
                  <td className="p-3 text-center">S/.{item.montototal}</td>
                  <td className="p-3 py-4 text-center">
                  {item.estado === "Pagado" ? "PAGADO" : (
                        <button
                          className="bg-green-500 text-white px-4 py-1 rounded-lg hover:bg-green-600 transition"
                          onClick={() => handlePagar(item.presupuestoid)}
                        >
                          Pagar
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="flex justify-center mt-6 gap-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded-lg border ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
            >
              {index + 1}
            </button>
          ))}
        </div>{showModal && (
          <Modal onClose={() => setShowModal(false)}>
            <div className="text-center">
              {loading ? (
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-4">Pagando...</p>
                  <div className="loader mx-auto animate-spin border-4 border-gray-300 border-t-blue-500 rounded-full w-12 h-12"></div>
                </div>
              ) : modalMessage ? (
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-4">{modalMessage}</p>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition"
                    onClick={() => setShowModal(false)}
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Confirmar Pago</h2>
                  <p className="mt-4 text-gray-700">¿Seguro de pagar esto?</p>
                  {selectedIndemnizacion && (
                    <div className="mt-4 text-gray-700">
                      <p>
                        <strong>SINIESTRO:</strong> {"SIN-" + selectedIndemnizacion.siniestroid}
                      </p>
                      <p>
                        <strong>FECHA DEL SINIESTRO:</strong>{" "}
                        {new Date(selectedIndemnizacion.fecha_siniestro).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>MONTO DEL SINIESTRO:</strong> S/.{selectedIndemnizacion.montototal}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-center gap-4 mt-4">
                    <button
                      className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg text-white transition"
                      onClick={confirmPagar}
                    >
                      Sí
                    </button>
                    <button
                      className="bg-gray-500 hover:bg-gray-600 px-5 py-2 rounded-lg text-white transition"
                      onClick={() => setShowModal(false)}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

            </div>
          </Modal>
        )}

      </div>
    </>
  );
};

export default Indemnizaciones;
