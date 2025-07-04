import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle } from "lucide-react";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";

const API_RECLAMACIONES_URL = "https://segurosflexreclamaciones.onrender.com/gestionreclamaciones";

interface AlertType {
  type: "success" | "error";
  message: string;
}

interface Documento {
  documentoId: number;
  nombre: string;
  extension: string;
  url: string;
  estado_documento: string;
}

const ValidarReclamacion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDocumentos = async () => {
      try {
        setLoading(true);
        const response = await axios.get<any>(`${API_RECLAMACIONES_URL}/${id}/detalles`);
        setDocumentos(response.data.documentos); // Asumiendo que recibes los documentos en esta estructura
      } catch (error) {
        setAlert({ type: "error", message: "No se pudieron cargar los documentos" });
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentos();
  }, [id]);

  const handleValidarDocumentos = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_RECLAMACIONES_URL}/${id}/validar-documentos`);
      setAlert({ type: "success", message: "Documentos validados con éxito" });

      setTimeout(() => {
        navigate("/gestionreclamaciones");
      }, 2000);
    } catch (error) {
      setAlert({ type: "error", message: "Error al validar los documentos" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-red-100 via-red-200 to-red-300 text-gray-900 pt-24">
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}
        <div className="flex flex-col gap-6 w-full max-w-6xl">
          <div className="bg-white shadow-lg rounded-xl p-6 border border-red-300">
            <h2 className="text-xl font-bold text-red-700 mb-4">Documentos de Reclamación</h2>
            {loading && <div>Loading...</div>}
            <div className="space-y-4">
              {documentos.map((doc) => (
                <div key={doc.documentoId} className="p-4 border border-gray-300 rounded-md">
                  <div className="flex justify-between">
                    <span>{doc.nombre}</span>
                    <span>{doc.estado_documento}</span>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    Ver Documento
                  </a>
                  {doc.estado_documento !== 'Validado' && (
                    <button
                      onClick={handleValidarDocumentos}
                      className="mt-2 bg-blue-500 text-white py-2 px-4 rounded"
                    >
                      Validar Documento
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleValidarDocumentos}
            className="btn-primary flex items-center gap-2 px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            <CheckCircle size={18} /> Validar Todos los Documentos
          </button>
        </div>
      </div>
    </>
  );
};

export default ValidarReclamacion;
