import { useState, useEffect} from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";


interface Siniestro {
  siniestroid: number;
  beneficiarioid: number;
  tipo_siniestro: string;
  fecha_siniestro: string;
  estado: string;
  tallerid?: number | null;
}

interface Taller {
  tallerid: number;
  nombre: string;
  capacidad: number;
  direccion: string;
  estado: string;
}

const AsignarTaller = () => {
  const navigate = useNavigate();
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [siniestrosFiltrados, setSiniestrosFiltrados] = useState<Siniestro[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filtro, setFiltro] = useState("normal"); // Estado del filtro
  const [selectedSiniestro, setSelectedSiniestro] = useState<number | null>(null);
  const [selectedTaller, setSelectedTaller] = useState<number | null>(null);
  const [searchBeneficiario, setSearchBeneficiario] = useState("");
 


  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);
  const [estadoTemp, setEstadoTemp] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = siniestrosFiltrados.slice(indexOfFirstPost, indexOfLastPost);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siniestrosResponse, talleresResponse] = await Promise.all([
          axios.get<any>("https://segurosflexbeneficiarios.onrender.com/api/siniestros"),
          axios.get<any>("https://segurosflextalleresproveedores.onrender.com/api/talleres"),
        ]);
        const talleresDisponibles = talleresResponse.data.filter((taller: Taller) => taller.estado !== "Ocupado");
        setSiniestros(siniestrosResponse.data);
        setTalleres(talleresDisponibles);
        setSiniestrosFiltrados(siniestrosResponse.data);
      } catch (error) {
        setError("Error al obtener los datos.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Manejo del filtro
  useEffect(() => {
    let filtrados = siniestros;
  
    // ✅ Filtrar por estado del siniestro en lugar de si tiene un taller asignado
    if (filtro !== "todos") {
      filtrados = filtrados.filter((siniestro) => {
        if (filtro === "no_asignado") return siniestro.estado === "No asignado";
        if (filtro === "asignado") return siniestro.estado === "Asignado";
        if (filtro === "en_proceso") return siniestro.estado === "En proceso";
        if (filtro === "culminado") return siniestro.estado === "Culminado";
        return true;
      });
    }
  
    // 🔎 Filtrar por ID de Beneficiario (si está ingresado)
    if (searchBeneficiario) {
      filtrados = filtrados.filter((siniestro) =>
        siniestro.beneficiarioid.toString().includes(searchBeneficiario)
      );
    }
  
    setSiniestrosFiltrados(filtrados);
    setCurrentPage(1); // 🔥 Resetear a la primera página cuando cambia el filtro
  
  }, [filtro, siniestros, searchBeneficiario]);


  const handleConfirmAsignar = async () => {
    if (selectedSiniestro !== null && selectedTaller !== null) {
      try {
        const response = await axios.put("https://segurosflexbeneficiarios.onrender.com/api/siniestros/asignar", {
          siniestroid: selectedSiniestro,
          tallerid: selectedTaller,
        });
  
        if (response.status === 200) {
          setSiniestros(prevSiniestros =>
            prevSiniestros.map(siniestro =>
              siniestro.siniestroid === selectedSiniestro
                ? { ...siniestro, tallerid: selectedTaller, estado: "Asignado" } // Actualiza localmente
                : siniestro
            )
          );
  
          setSuccessMessage("✅ Taller asignado exitosamente.");
          setTimeout(() => setSuccessMessage(""), 3000);
        }
        
        setSelectedSiniestro(null);
      } catch (error) {
        console.error("Error al asignar el taller:", error);
      }
    }
  };

  const handleChangeEstado = (nuevoEstado: string) => {
    setEstadoTemp(nuevoEstado); // Solo guarda el estado temporalmente
  };

  const handleConfirmarCambioEstado = async () => {
    if (!estadoTemp || selectedEstado === null) return; // Evita errores si no hay estado seleccionado
  
    try {
      await axios.put("https://segurosflexbeneficiarios.onrender.com/api/siniestros/cambiar/estado", {
        siniestroid: selectedEstado,
        estado: estadoTemp,
      });
  
      // 🔄 Actualizar el estado en la tabla sin recargar la página
      setSiniestros((prevSiniestros) =>
        prevSiniestros.map((s) =>
          s.siniestroid === selectedEstado ? { ...s, estado: estadoTemp } : s
        )
      );
  
      setSelectedEstado(null); // 🔹 Ocultar la interfaz de cambio de estado
      setEstadoTemp(""); // 🔹 Limpiar el estado temporal
      setSuccessMessage("✅ Estado actualizado correctamente.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error al cambiar el estado:", error);
      setError("❌ No se pudo actualizar el estado.");
    }
  };

  // Función para cambiar de página
const paginate = (pageNumber: number) => {
  if (pageNumber >= 1 && pageNumber <= Math.ceil(siniestrosFiltrados.length / postsPerPage)) {
    setCurrentPage(pageNumber);
  }
};

const handleAsignarClick = (siniestroid: number) => {
  setSelectedSiniestro(siniestroid);
  setSelectedTaller(null);
  setSelectedEstado(null); // Ocultar el botón de Cambiar Estado
};

const handleCambiarEstadoClick = (siniestroid: number) => {
  setSelectedEstado(siniestroid);
  setSelectedSiniestro(null); // Ocultar la selección de taller
};


  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-red-100 via-red-200 to-red-300 p-6">
      
      {successMessage && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 ease-in-out z-50">
          {successMessage}
        </div>
      )}
      <div className="flex flex-grow justify-center items-center p-10">
       <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-7xl">
       <h1 className="text-4xl font-extrabold text-gray-800 text-center mx-auto">
        🚗 Asignar Taller a Siniestro
       </h1>
          {loading && <p className="text-center">Cargando datos...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {/* Buscador por ID de Beneficiario */}
          <div className="bg-white p-4 shadow-md rounded-lg flex gap-4 mb-6">
          <div className="flex flex-col w-1/2">
            <label className="text-gray-700 font-semibold">Buscar por ID de Beneficiario</label>
            <input
              type="text"
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-red-200"
              placeholder="Ingrese ID de Beneficiario"
              value={searchBeneficiario}
              onChange={(e) => setSearchBeneficiario(e.target.value)}
            />
          </div>
            <div className="flex flex-col w-1/2">
            <label className="text-gray-700 font-semibold">Filtrar por Estado</label>
            <select
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-red-200"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="no_asignado">No asignado</option>
              <option value="asignado">Asignado</option>
              <option value="en_proceso">En proceso</option>
              <option value="culminado">Culminado</option>
            </select>
          </div>
        </div>

          {/* Tabla de siniestros */}
          <div className="bg-white rounded-xl shadow-xl p-6 w-full overflow-x-auto">
          <table className="w-full border border-gray-200 text-gray-800">
            <thead className="bg-gradient-to-r from-red-500 to-red-400 text-white uppercase text-sm tracking-wide">
              <tr>
              <th className="p-3 text-center w-[5%]">ID</th>
        <th className="p-3 text-center w-[20%]">Tipo de Siniestro</th>
        <th className="p-3 text-center w-[15%]">Fecha</th>
        <th className="p-3 text-center w-[15%]">Estado</th>
        <th className="p-3 text-center w-[15%]">ID Beneficiario</th>
        <th className="p-3 text-center w-[30%]">Acciones</th>

              </tr>
            </thead>
            <tbody>
            {currentPosts.map((siniestro) => (
                <tr key={siniestro.siniestroid} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3 text-center">{siniestro.siniestroid}</td>
                  <td className="p-3 text-center">{siniestro.tipo_siniestro}</td>
                  <td className="p-3 text-center">{new Date(siniestro.fecha_siniestro).toLocaleDateString()}</td>
                  <td className="p-3 text-center">{siniestro.estado}</td>
                  <td className="p-3 text-center">{siniestro.beneficiarioid}</td>
                  <td className="p-3 flex justify-center gap-2">
                  {/* Solo mostrar el botón si este siniestro NO está en modo edición */}
                  
                  {siniestro.estado !== "Culminado" && (
                    <>
                  {selectedSiniestro !== siniestro.siniestroid && selectedEstado !== siniestro.siniestroid && (
                    <button
                      onClick={() => handleAsignarClick(siniestro.siniestroid)}
                      className={`px-4 py-2 rounded-lg transition duration-300 ${
                        siniestro.tallerid
                          ? "bg-green-600 text-white hover:bg-green-800"
                          : "bg-blue-600 text-white hover:bg-blue-800"
                      }`}
                    >
                      {siniestro.tallerid ? "Cambiar Taller" : "Asignar Taller"}
                    </button>
                  )}
                  {/* Mostrar el botón de cambiar estado SOLO si está en "Asignado" o "En proceso" */}
                  {selectedEstado !== siniestro.siniestroid &&
                    selectedSiniestro !== siniestro.siniestroid && // 🔹 Asegura que no se está editando el taller
                    (siniestro.estado === "Asignado" || siniestro.estado === "En proceso") && (
                      <button
                        onClick={() => handleCambiarEstadoClick(siniestro.siniestroid)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                      >
                        Cambiar Estado
                      </button>
                  )}
                    </>
                  )}
                    {/* Mostrar el selector de estado cuando se haga clic en "Cambiar Estado" */}
                    {selectedEstado === siniestro.siniestroid && (
                    <div className="flex flex-col items-center justify-center text-center mt-4">
                      {/* 🔹 Centra el texto "Seleccionar Estado" */}
                      <label className="block text-gray-700 font-semibold mb-2 text-lg">
                        Seleccionar Estado
                      </label>

                      {/* 🔹 Centra el select */}
                      <select
                        className="w-3/4 p-3 border border-gray-300 rounded-lg bg-white shadow-md text-gray-800 font-semibold focus:ring focus:ring-yellow-300"
                        value={estadoTemp || ""}
                        onChange={(e) => handleChangeEstado(e.target.value)} // 🔹 Solo almacena el estado temporalmente
                      >
                        <option value="">Estado</option>
                        <option value="En proceso">En Proceso</option>
                        <option value="Culminado">Culminado</option>
                      </select>

                      {/* 🔹 Centra los botones */}
                      <div className="flex justify-center gap-4 mt-4">
                        <button
                          onClick={() => setSelectedEstado(null)}
                          className="px-6 py-2 bg-gray-400 text-white rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleConfirmarCambioEstado} // 🔹 Ahora solo cambia cuando el usuario lo confirma
                          className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-800"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selector de taller solo si este siniestro está seleccionado */}
                  {selectedSiniestro === siniestro.siniestroid && (
                    <div className="flex flex-col items-center justify-center text-center mt-4">
                      <label className="block text-gray-700 font-semibold mb-2">Seleccionar Taller</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-md text-gray-800 font-semibold focus:ring focus:ring-red-300"
                        value={selectedTaller || ""}
                        onChange={(e) => setSelectedTaller(Number(e.target.value))}
                      >
                        <option value="" className="text-gray-500">Seleccione un taller</option>
                        {talleres.map((taller) => (
                          <option key={taller.tallerid} value={taller.tallerid}>
                            🏭 {taller.nombre} | 👥 {taller.capacidad} | 📍 {taller.direccion}
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          onClick={() => setSelectedSiniestro(null)}
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleConfirmAsignar}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}
                </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-gray-500 text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              Anterior
            </button>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={indexOfLastPost >= siniestrosFiltrados.length}
              className="bg-gray-500 text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>

          {/* Información de la página actual */}
          <div className="mt-4 text-center">
            <p>
              Mostrando {indexOfFirstPost + 1} a {Math.min(indexOfLastPost, siniestrosFiltrados.length)} de {siniestrosFiltrados.length} siniestros
            </p>
            <p>
              Página {currentPage} de {Math.ceil(siniestrosFiltrados.length / postsPerPage)}
            </p>
          </div>



        </div>
      </div>

      {/* Contenedor de botones debajo del mapa */}
        <div className="flex justify-center w-full mt-6">
        <button
          onClick={() => navigate("/dashboard/personal")}
          className="bg-gray-600 text-white font-bold px-12 py-4 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-700"
        >
          Regresar al Dashboard
        </button>
        </div> 


    </div>

    
  </>
  );
};

export default AsignarTaller;

