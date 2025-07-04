import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "react-toastify/dist/ReactToastify.css";  // Importamos estilos de Toastify
import { toast, ToastContainer } from "react-toastify";
import "mapbox-gl/dist/mapbox-gl.css";
import Navbar from "../components/Navbar";
import { useAuth } from '../context/AuthContext';  // Importar el contexto de autenticación
import Assistant from "../components/Assistant"; // Importa el componente Assistant
mapboxgl.accessToken =
  "pk.eyJ1IjoiZGFuaWVscHJ1ZWJhMjMiLCJhIjoiY200YnlpbGV5MDVqeTJ3b3ZsOXp0bXpmbiJ9.bh_ogcw3BioUBy--uuJ0LQ";

// Definir el tipo explícito para el estado 'form'
type FormState = {
  tipoSiniestro: string;
  fechaSiniestro: string;
  departamento: string;
  distrito: string;
  provincia: string;
  ubicacion: string;
  descripcion: string;
  documentos: File[]; // Cambiar 'never[]' a 'File[]'
};

const RegistroSiniestro = () => {
  const navigate = useNavigate(); // Hook para la navegación
  const { user } = useAuth(); // Obtener el usuario del contexto
  const [form, setForm] = useState<FormState>({
    tipoSiniestro: "Accidente", // Valor predeterminado
    fechaSiniestro: "",
    departamento: "",
    distrito: "",
    provincia: "",
    ubicacion: "",
    descripcion: "",
    documentos: [] // Inicializa 'documentos' como un arreglo vacío de tipo File[]
  });

  const [imageUrl] = useState<string | null>(null); // Estado para la URL de la imagen
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Obtener BeneficiarioID y PolizaID al cargar el componente
  useEffect(() => {
    const fetchUsuarioID = async () => {
      if (!user || !user.UsuarioID) return;

      try {
        // Obtener el UsuarioID desde el backend o contexto
        setForm((prevForm) => ({
          ...prevForm,
          usuarioID: user.UsuarioID,  // Asignar el UsuarioID al estado
        }));
      } catch (error) {
        console.error("Error al obtener UsuarioID:", error);
        toast.error("No se pudo obtener el UsuarioID.");
      }
    };

    fetchUsuarioID();
}, [user]);

// Los tres mensajes
const messages = [
  "Lamentamos lo sucedido :c ",
  "Recuerda que trataremos de atenderte lo antes posible <3",
  "Con nosotros tu inversion esta segura :D"
];

// Los tiempos en milisegundos para cada mensaje
const delays = [2000, 3000, 4000]; // 2, 3, y 4 segundos
const finalDelay = 5000; // El mensaje desaparecerá después de 5 segundos

  // Manejar cambios en los campos del formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // Manejar los archivos seleccionados
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setForm((prevForm) => ({
        ...prevForm,
        documentos: Array.from(selectedFiles), // Convierte los archivos seleccionados en un arreglo
      }));
    }
  };

  // Configuración y mapa de ubicación
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-77.0428, -12.0464], // Coordenadas iniciales
      zoom: 12,
    });

    map.on("load", () => {
      map.on("click", (e) => {
        const { lng, lat } = e.lngLat;

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new mapboxgl.Marker()
            .setLngLat([lng, lat])
            .addTo(mapRef.current!);
        }

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            const address = data.address;
            setForm((prev) => ({
              ...prev,
              ubicacion: data.display_name,
              distrito: address.suburb || "",
              provincia: address.city || "",
              departamento: address.state || "",
            }));
          })
          .catch((error) => {
            console.error("Error al obtener la dirección:", error);
            setForm((prev) => ({
              ...prev,
              ubicacion: `${lat}, ${lng}`,
            }));
          });
      });
    });

    mapRef.current = map;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir el comportamiento predeterminado de enviar el formulario
  
    const formData = new FormData();
    formData.append("tipoSiniestro", form.tipoSiniestro);
    formData.append("fechaSiniestro", form.fechaSiniestro);
    formData.append("departamento", form.departamento);
    formData.append("distrito", form.distrito);
    formData.append("provincia", form.provincia);
    formData.append("ubicacion", form.ubicacion);
    formData.append("descripcion", form.descripcion); // Agregar PolizaID
  
    // Inicializa un arreglo vacío para almacenar las URLs de las imágenes
    const imageUrls: string[] = [];
  
    try {
      // Enviar cada archivo individualmente
      for (let i = 0; i < form.documentos.length; i++) {
        const file = form.documentos[i];
  
        // Crear un nuevo FormData para cada archivo
        const fileFormData = new FormData();
        fileFormData.append("image", file); // Agregar el archivo al FormData
  
        // Enviar el archivo al servidor
        const response = await axios.post<any>(
          "https://segurosflexbeneficiarios.onrender.com/upload",
          fileFormData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
  
        // Obtener la URL de la imagen y agregarla al arreglo
        const imageUrl = response.data.secure_url;
        imageUrls.push(imageUrl); // Guardar la URL de la imagen
  
        // Mostrar la URL (puedes mostrarlo aquí o hacer cualquier otra acción)
        console.log(`Imagen subida: ${imageUrl}`);
      }
  
      // Enviar la información del siniestro con las URLs de las imágenes
      const secondResponse = await axios.post<any>(
        "https://segurosflexbeneficiarios.onrender.com/api/siniestros",
        { ...form, documentos: imageUrls }
      );
  
      toast.success("¡Siniestro registrado con éxito! ID: " + secondResponse.data.siniestroId); // Notificación de éxito
    } catch (error) {
      toast.error("Error al registrar el siniestro. Intenta de nuevo."); // Notificación de error
      console.error("Error al registrar el siniestro:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-100 via-red-200 to-red-300 p-6">
      <Navbar />
      <div className="flex justify-center items-center py-10">
        <div className="max-w-[90%] lg:max-w-[1200px] w-full bg-white border border-gray-200 rounded-lg shadow-2xl p-12">
          <h1 className="text-6xl lg:text-5xl font-extrabold text-center mb-10 tracking-wide uppercase bg-gradient-to-r from-red-700 to-red-500 bg-clip-text text-transparent">
            Registrar Siniestro
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  name="tipoSiniestro"
                  placeholder="Tipo de Siniestro"
                  value={form.tipoSiniestro}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm transition-all duration-300 hover:shadow-md"
                  required
                />
                <input
                  type="date"
                  name="fechaSiniestro"
                  value={form.fechaSiniestro}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm transition-all duration-300 hover:shadow-md"
                  required
                />
                 <input
                  type="text"
                  name="departamento"
                  placeholder="Departamento"
                  value={form.departamento}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm transition-all duration-300 hover:shadow-md"
                />
                <input
                  type="text"
                  name="distrito"
                  placeholder="Distrito"
                  value={form.distrito}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm transition-all duration-300 hover:shadow-md"
                />
                <input
                  type="text"
                  name="provincia"
                  placeholder="Provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm transition-all duration-300 hover:shadow-md"
                />
                <input
                  type="text"
                  name="ubicacion"
                  placeholder="Ubicación"
                  value={form.ubicacion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm transition-all duration-300 hover:shadow-md"
                />
              
  
              </div>

              <textarea
                name="descripcion"
                placeholder="Descripción"
                value={form.descripcion}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm transition-all duration-300 hover:shadow-md"
                required
              ></textarea>

              <div>
                <input
                  type="file"
                  name="documentos"
                  multiple
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none shadow-sm transition-all duration-300 hover:shadow-md"
                />
              </div>

              {/* Botón "Registrar Siniestro" */}
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-red-800 text-white font-bold px-12 py-4 rounded-lg text-lg w-full mt-6 transition duration-300 ease-in-out transform hover:scale-105 hover:bg-red-700"
              >
                Registrar Siniestro
              </button>
            </form>

            {/* Mapa */}
            <div className="w-full h-[480px] border-2 border-red-500 rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-105">
              <div ref={mapContainerRef} className="w-full h-full"></div>
            </div>
            <ToastContainer />  {/* Contenedor de notificaciones */}
          </div>

          {/* Mostrar imagen subida */}
          {imageUrl && (
            <div className="text-center mt-4">
              <p className="font-semibold text-lg mb-2">Imagen subida:</p>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 underline hover:text-red-800"
              >
                Ver imagen
              </a>
              <img
                src={imageUrl}
                alt="Imagen subida"
                className="mt-4 max-w-xs rounded-lg shadow-md border-2 border-red-500 p-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Contenedor de botones debajo del mapa */}
      <div className="flex justify-center w-full mt-6">
        <button
          onClick={() => navigate("/dashboard/general")}
          className="bg-gray-600 text-white font-bold px-12 py-4 rounded-lg text-lg w-1/2 transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-700"
        >
          Regresar al Dashboard
        </button>
      </div>
    {/* Integración del Asistente con tres mensajes y tiempos personalizados */}
<Assistant 
  messages={messages} 
  delays={delays} 
  finalDelay={finalDelay} 
/>
   
 </div>
 
  );
  
};

export default RegistroSiniestro;
