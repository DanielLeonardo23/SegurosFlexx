import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import axios from "axios";

const API_PRESUPUESTO_URL = "http://localhost:4002/api/presupuesto-pagos"; // 🔗 URL local correcta
//const API_PRESUPUESTO_URL = "https://segurosflexpresupuestopagos.onrender.com/api/presupuesto-pagos"; // URL de producción
interface AlertType {
  type: "success" | "error";
  message: string;
}

interface Poliza {
  tipopoliza: string;
  fechainicio: string;
  fechafin: string;
  estado: string;
}

interface Presupuesto {
  siniestroid: number;
  montototal: number;
  detalle_presupuesto: string;
  costo_reparacion: number;
  costo_piezas_mano_obra: number;
}

interface DocumentosResponse {
  obtener_documentos?: string;
}

const GestionarPresupuesto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [documentos, setDocumentos] = useState<string[]>([]);
  const [poliza, setPoliza] = useState<Poliza | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [polizaRes, presupuestoRes, documentosRes] = await Promise.all([
          axios.get<Poliza>(`${API_PRESUPUESTO_URL}/poliza/${id}`),
          axios.get<Presupuesto>(`${API_PRESUPUESTO_URL}/${id}`),
          axios.get<DocumentosResponse>(`${API_PRESUPUESTO_URL}/documentos/${id}`)
        ]);
  
        setPoliza(polizaRes.data);
        setPresupuesto(presupuestoRes.data);
  
        if (documentosRes.data?.obtener_documentos) {
          setDocumentos(JSON.parse(documentosRes.data.obtener_documentos));
        } else {
          setDocumentos([]);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setAlert({ type: "error", message: "Error al cargar datos" });
      }
  
      // Mantener el spinner por al menos 1 segundo
      setTimeout(() => setCargando(false), 500);
    };
  
    fetchData();
  }, [id]);
  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <p className="text-center text-gray-700 mt-2">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  const handleValidarPresupuesto = async () => {
    if (!presupuesto) return;

    const montoTotal =
      Number(presupuesto.costo_reparacion) + Number(presupuesto.costo_piezas_mano_obra);
    const fechaCreacion = new Date().toISOString().split(".")[0];

    const data = {
      montototal: montoTotal,
      costo_reparacion: Number(presupuesto.costo_reparacion),
      costo_piezas_mano_obra: Number(presupuesto.costo_piezas_mano_obra),
      detalle_presupuesto: presupuesto.detalle_presupuesto,
      estado: "Validado",
      fechacreacion: fechaCreacion,
    };

    try {
      axios.put(`${API_PRESUPUESTO_URL}/${id}`, data); // await apiClient.put(`/${id}`,data);
      setAlert({ type: "success", message: "Presupuesto validado correctamente" });
      setTimeout(() => {
        navigate("/gestionarpresupuestos");
      }, 2000);
    } catch (error) {
      setAlert({ type: "error", message: "Error al validar presupuesto" });
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toISOString().split("T")[0];

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-red-100 via-red-200 to-red-300 text-gray-900 pt-24">
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}
  
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl">
          {/* Sección izquierda: Presupuesto y Póliza */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            {presupuesto && (
              <div className="bg-white shadow-lg rounded-xl p-6 border border-red-300">
                <h2 className="text-xl font-bold text-red-700 mb-4 text-center">Detalles del Presupuesto</h2>
                <p className="block mt-2 text-gray-700 font-semibold">
                  Código de Siniestro: {`SIN-${presupuesto.siniestroid}`}
                </p>
                <label className="block mt-2 text-gray-700 font-semibold">Costo de Reparación:</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-200"
                  value={presupuesto.costo_reparacion}
                  onChange={(e) =>
                    setPresupuesto((prev) =>
                      prev ? { ...prev, costo_reparacion: Number(e.target.value) } : null
                    )
                  }
                />
  
                <label className="block mt-2 text-gray-700 font-semibold">
                  Costo Piezas y Mano de Obra:
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-200"
                  value={presupuesto.costo_piezas_mano_obra}
                  onChange={(e) =>
                    setPresupuesto((prev) =>
                      prev ? { ...prev, costo_piezas_mano_obra: Number(e.target.value) } : null
                    )
                  }
                />
  
                <strong className="block mt-2 text-gray-700 font-semibold">
                  Monto Total: S/ {Number(presupuesto.costo_reparacion) + Number(presupuesto.costo_piezas_mano_obra)}
                </strong>
  
                <label className="block mt-2 text-gray-700 font-semibold">Detalle del Presupuesto:</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-200"
                  value={presupuesto.detalle_presupuesto}
                  onChange={(e) =>
                    setPresupuesto((prev) =>
                      prev ? { ...prev, detalle_presupuesto: e.target.value } : null
                    )
                  }
                />
              </div>
            )}
  
            {poliza && (
              <div className="bg-white shadow-lg rounded-xl p-6 border border-red-300">
                <h2 className="text-xl font-bold text-red-700 mb-4 text-center">Detalles de la Póliza</h2>
                <p><strong>Tipo:</strong> {poliza.tipopoliza}</p>
                <p><strong>Fecha Inicio:</strong> {formatDate(poliza.fechainicio)}</p>
                <p><strong>Fecha Fin:</strong> {formatDate(poliza.fechafin)}</p>
                <p><strong>Estado:</strong> {poliza.estado}</p>
              </div>
            )}
          </div>
  
          {/* Sección derecha: Acciones y Documentos */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="bg-white shadow-lg rounded-xl p-6 border border-red-300 flex flex-col gap-4 items-center">
              <h2 className="text-xl font-bold text-red-700 mb-4 text-center">Acciones</h2>
              <button
                className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-blue-600 transition"
                onClick={() => navigate("/gestionarpresupuestos")}
              >
                <ArrowLeft size={18} />
                Regresar a Presupuestos
              </button>
              <button
                className="btn-primary flex items-center gap-2 px-6 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
                onClick={handleValidarPresupuesto}
              >
                <CheckCircle size={18} /> Validar Presupuesto
              </button>
            </div>
  
            <div className="bg-white shadow-lg rounded-xl p-6 border border-red-300">
              <p className="text-xl font-bold text-red-700 mb-4 text-center">Documentos Adjuntos</p>
              {documentos.map((doc, index) => (
                <button key={index} onClick={() => window.open(doc, "_blank")} className="w-full text-center text-blue-500 hover:underline">
                  Documento {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
};

export default GestionarPresupuesto;
