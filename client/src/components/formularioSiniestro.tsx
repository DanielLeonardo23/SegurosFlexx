// FormularioSiniestro.tsx

import React, { useState } from "react";
import axios from "axios";

type FormState = {
  tipoSiniestro: string;
  fechaSiniestro: string;
  departamento: string;
  distrito: string;
  provincia: string;
  ubicacion: string;
  descripcion: string;
  documentos: File[];
};

interface FormularioSiniestroProps {
  onSubmit: (form: FormState, imageUrl: string | null) => void;
}

const FormularioSiniestro: React.FC<FormularioSiniestroProps> = ({ onSubmit }) => {
  const [form, setForm] = useState<FormState>({
    tipoSiniestro: "Accidente",
    fechaSiniestro: "",
    departamento: "",
    distrito: "",
    provincia: "",
    ubicacion: "",
    descripcion: "",
    documentos: [],
  });

  const [, setImageUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setForm((prevForm) => ({
        ...prevForm,
        documentos: Array.from(selectedFiles),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tipoSiniestro = form.tipoSiniestro.trim() === "" ? "Accidente" : form.tipoSiniestro;
    const formData = new FormData();
    formData.append("tipoSiniestro", tipoSiniestro);
    formData.append("fechaSiniestro", form.fechaSiniestro);
    formData.append("departamento", form.departamento);
    formData.append("distrito", form.distrito);
    formData.append("provincia", form.provincia);
    formData.append("ubicacion", form.ubicacion);
    formData.append("descripcion", form.descripcion);

    form.documentos.forEach((doc) => {
      formData.append("image", doc);
    });

    try {
      const response = await axios.post<any>("https://segurosflexbeneficiarios.onrender.com/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedImageUrl = response.data.secure_url;
      setImageUrl(uploadedImageUrl);

      onSubmit(form, uploadedImageUrl);
    } catch (error) {
      console.error("Error al registrar el siniestro:", error);
      alert("Ocurrió un error al registrar el siniestro");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        name="tipoSiniestro"
        placeholder="Tipo de Siniestro"
        value={form.tipoSiniestro}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500"
        required
      />
      <input
        type="date"
        name="fechaSiniestro"
        value={form.fechaSiniestro}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800"
        required
      />
      <textarea
        name="descripcion"
        placeholder="Descripción"
        value={form.descripcion}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800"
        required
      ></textarea>
      <input
        type="file"
        name="documentos"
        multiple
        onChange={handleFileChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
      />
      <button
        type="submit"
        className="bg-gradient-to-r from-red-600 to-red-800 text-white font-bold px-12 py-4 rounded-lg text-lg w-full mt-6"
      >
        Registrar Siniestro
      </button>
    </form>
  );
};

export default FormularioSiniestro;
