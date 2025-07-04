import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, ArrowLeft } from "lucide-react";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";

//Ruta para manejarlo con vercel y render
const API_PRESUPUESTOS_URL =
  import.meta.env.VITE_API_PRESUPUESTOS_URL || "http://localhost:4002/api/presupuesto-pagos";
const Presupuestos = () => {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [filteredPresupuestos, setFilteredPresupuestos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("siniestroid");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const presupuestosPorPagina = 15;
  const navigate = useNavigate();

  useEffect(() => {
    fetchPresupuestos();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [search, searchField, sortField, sortOrder, presupuestos]);

  const fetchPresupuestos = async () => {
    try {
      const response = await fetch(API_PRESUPUESTOS_URL);
      const data = await response.json();
      setPresupuestos(data);
      setFilteredPresupuestos(data);
    } catch (error) {
      setAlert({ type: "error", message: "Error al obtener presupuestos" });
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
    let filtered = presupuestos.filter((p) => {
      let value = p[searchField];

      if (searchField === "fecha_asignacion" && value) {
        value = new Date(value).toLocaleDateString(); // Convierte la fecha a formato legible (DD/MM/YYYY)
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
              const idNum = p.siniestroid.toString();
              return idNum.startsWith(searchNum);
            } else {
              return false;
            }
          }
        }
      }

      return value?.toString().toLowerCase().includes(search.toLowerCase());
    });

    if (sortField) {
      filtered.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Ordenamiento especial para siniestroid (extrayendo parte numérica).
        if (sortField === "siniestroid") {
          valA = parseSiniestroId(valA);
          valB = parseSiniestroId(valB);
        }
        // Ordenamiento especial para fecha_asignacion.
        else if (sortField === "fecha_asignacion") {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        // Ordenamiento por texto (cualquier otro campo).
        else {
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



    setFilteredPresupuestos(filtered);
    setCurrentPage(1); // Reinicia a la primera página al filtrar o cambiar criterios
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Paginación
  const totalPages = Math.ceil(filteredPresupuestos.length / presupuestosPorPagina);
  const indexOfLastPresupuesto = currentPage * presupuestosPorPagina;
  const indexOfFirstPresupuesto = indexOfLastPresupuesto - presupuestosPorPagina;
  const currentPresupuestos = filteredPresupuestos.slice(indexOfFirstPresupuesto, indexOfLastPresupuesto);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <Navbar />
      <div className="p-8 min-h-screen bg-gradient-to-br from-white via-gray-100 to-red-50 text-gray-900 pt-24">
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
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
            📋 Presupuestos
          </h1>
        </div>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar presupuesto..."
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="p-3 border border-gray-300 rounded-lg"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="siniestroid">Siniestro ID</option>
            <option value="fecha_asignacion">Fecha Asignación</option>
            <option value="nombre">Taller</option>
            <option value="tipo_siniestro">Tipo Siniestro</option>
          </select>
          <select
            className="p-3 border border-gray-300 rounded-lg"
            value={sortField || ""}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="">Ordenar por...</option>
            <option value="siniestroid">Siniestro ID</option>
            <option value="fecha_asignacion">Fecha Asignación</option>
            <option value="nombre">Taller</option>
            <option value="tipo_siniestro">Tipo Siniestro</option>
          </select>
          <button
            className="flex items-center gap-1 bg-white text-black border border-gray-300 px-3 py-2 rounded-lg shadow-md hover:bg-gray-200 transition mx-auto"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            ↑↓
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-xl p-6">
          <table className="w-full border border-gray-200 text-gray-800">
            <thead className="bg-gradient-to-r from-red-500 to-red-400 text-white uppercase text-sm tracking-wide">
              <tr>
                <th className="p-3 text-center">Siniestro ID</th>
                <th className="p-3 text-center">Fecha Asignación</th>
                <th className="p-3 text-center">Taller</th>
                <th className="p-3 text-center">Tipo Siniestro</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPresupuestos.map((presupuesto: any) => (
                <tr key={presupuesto.presupuestoid} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3 text-center">
                    {"SIN-" + presupuesto.siniestroid}
                  </td>
                  <td className="p-3 text-center">
                    {presupuesto.fecha_asignacion
                      ? new Date(presupuesto.fecha_asignacion).toLocaleString()
                      : "No asignada"}
                  </td>
                  <td className="p-3 text-center">{presupuesto.nombre || "N/A"}</td>
                  <td className="p-3 text-center">{presupuesto.tipo_siniestro}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() =>
                        navigate(`/detallepresupuesto/${presupuesto.presupuestoid}`)
                      }
                      className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-blue-600 transition mx-auto"
                    >
                      <Eye size={16} />
                      Validar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Controles de paginación */}
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
        </div>
      </div>
    </>
  );
};

export default Presupuestos;
