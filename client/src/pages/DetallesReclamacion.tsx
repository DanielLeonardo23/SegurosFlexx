import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify"; // Importar toast y ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Importar CSS de toast

import axios from "axios";
import {
  AiOutlineFileText,
  AiOutlineCheckCircle,
  AiOutlineFileSearch,
  AiOutlineSearch,
  AiOutlineTag,
  AiOutlineComment,
  AiOutlineClockCircle,
} from "react-icons/ai";
import { AiOutlineEye } from "react-icons/ai"; // Importar el ícono de ojo

import { IoMdArrowBack } from "react-icons/io";
import Navbar from "../components/Navbar";

const API_RECLAMACIONES_URL = "https://segurosflexreclamaciones.onrender.com/gestionreclamaciones";

interface Documento {
  documentoId: number;
  nombre: string;
  extension: string;
  url: string;
  estado_documento: string;
}

const DetallesReclamacion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reclamacion, setReclamacion] = useState<any>(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>("");
  const [observacion, setObservacion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

 
  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        setLoading(true);
        const response = await axios.get<any>(
          `${API_RECLAMACIONES_URL}/${id}/detalles`
        );
        setReclamacion(response.data);
        setEstadoSeleccionado(response.data.estado);
      } catch (error) {
        console.error("Error al cargar los detalles de la reclamación", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalles();
  }, [id]);


  const handleActualizarEstado = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_RECLAMACIONES_URL}/${id}/estado`, {
        estado: estadoSeleccionado,
        observacion,
      });
      toast.success("Reclamación actualizada con éxito", {
        onClose: () => navigate("/dashboard/personal/gestionar-reclamaciones"), // Redirige cuando el toast se cierre
      });
    } catch (error) {
        toast.error("Error al actualizar el estado"); // Mostrar notificación de error

      console.error("Error al actualizar el estado", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-red-100 via-red-200 to-red-300 text-gray-900 pt-24">
        <h2 className="text-5xl font-bold text-red-700 mb-">
          Detalles de la Reclamación
        </h2>
        {loading && <div>...</div>}
        {reclamacion && (
          <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-4xl mx-auto mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Código de Reclamación */}
              <div>
                <p className="text-lg">
                  <AiOutlineFileText className="inline-block mr-2" />
                  <strong>Código de Reclamación:</strong>{" "}
                  <span className="font-medium ml-2">
                    REC-{reclamacion.reclamacionid}
                  </span>
                </p>
              </div>

              {/* Fecha de Reclamación */}
              <div>
                <p className="text-lg">
                  <AiOutlineClockCircle className="inline-block mr-2" />
                  <strong>Fecha de Reclamación:</strong>{" "}
                  <span className="font-medium ml-2">
                    {new Date(reclamacion.fecha_reclamacion).toLocaleString()}
                  </span>
                </p>
              </div>

              {/* ID Siniestro */}
              <div>
                <p className="text-lg">
                  <AiOutlineSearch className="inline-block mr-2" />
                  <strong>ID Siniestro:</strong>{" "}
                  <span className="font-medium ml-2">
                    {reclamacion.siniestroid}
                  </span>
                </p>
              </div>

              {/* Tipo */}
              <div>
                <p className="text-lg">
                  <AiOutlineTag className="inline-block mr-2" />
                  <strong>Tipo:</strong>{" "}
                  <span className="font-medium ml-2">{reclamacion.tipo}</span>
                </p>
              </div>

              {/* Estado */}
              <div>
                <p className="text-lg">
                  <AiOutlineCheckCircle className="inline-block mr-2" />
                  <strong>Estado:</strong>{" "}
                  <span className="font-medium ml-2">{reclamacion.estado}</span>
                </p>
              </div>

              {/* Observación (Handling Null) */}
              <div>
                <p className="text-lg">
                  <AiOutlineComment className="inline-block mr-2" />
                  <strong>Observación:</strong>{" "}
                  <span className="font-medium ml-2">
                    {reclamacion.observacion || "No hay observaciones."}
                  </span>
                </p>
              </div>
            </div>

            {/* Descripción */}
            <div className="col-span-2 mt-6">
              <p className="text-lg">
                <strong>
                  <AiOutlineFileSearch className="inline-block mr-2" />{" "}
                  Descripción:
                </strong>
                <span className="font-medium ml-2">
                  {reclamacion.descripcion || "No hay descripción disponible."}
                </span>
              </p>
            </div>

            <div className="overflow-x-auto mt-6">
              <table className="min-w-full table-auto bg-white shadow-lg rounded-lg border-separate border-spacing-0">
                <thead className="bg-red-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-lg">
                      Nombre del Documento
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-lg">
                      Documento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reclamacion.documentos.length > 0 ? (
                    // Aseguramos que haya documentos
                    reclamacion.documentos.map((doc: Documento) => (
                      <tr key={doc.documentoId} className="hover:bg-gray-100">
                        <td className="px-6 py-4 border-b border-gray-200">
                          {doc.nombre}
                        </td>
                        <td className="px-6 py-4 border-b border-gray-200 flex items-center space-x-4">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 flex items-center"
                          >
                            <AiOutlineEye className="mr-2" /> Ver Documento
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No hay documentos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="mt-6 text-lg font-bold text-red-600">
              Cambiar Estado
            </h3>
            <select
              value={estadoSeleccionado}
              onChange={(e) => setEstadoSeleccionado(e.target.value)}
              className="mt-4 p-2 border border-gray-300 rounded-lg w-full"
            >
              <option
                value="Por Atender"
                disabled={reclamacion.estado === "Por Atender"}
              >
                Por Atender
              </option>
              <option
                value="En Proceso"
                disabled={reclamacion.estado === "En Proceso"}
              >
                En Proceso
              </option>
              <option
                value="Observada"
                disabled={reclamacion.estado === "Observada"}
              >
                Observada
              </option>
              <option
                value="Resuelta"
                disabled={reclamacion.estado === "Resuelta"}
              >
                Resuelta
              </option>
            </select>

            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Añadir observaciones"
              className="mt-4 p-2 border border-gray-300 rounded-lg w-full"
            />

            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={handleActualizarEstado}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300"
              >
                Actualizar Estado{" "}
                <AiOutlineCheckCircle className="inline-block ml-2" />
              </button>

              <button
                onClick={() => navigate("/dashboard/personal/gestionar-reclamaciones")}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300"
              >
                <IoMdArrowBack className="inline-block mr-2" /> Regresar a la
                Gestión de Reclamaciones
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DetallesReclamacion;
