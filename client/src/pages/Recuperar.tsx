import { useState } from "react";
import axios from "axios";
import logo from "../assets/logo.jpg";
import { EnvelopeIcon, KeyIcon } from "@heroicons/react/24/solid";
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post<{message: string}>("http://localhost:4004/auth/recuperar", { Email: email });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al enviar el correo.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-red-100">
     <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
     <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="SegurosFlex" className="w-24 mb-2" />
          <h1 className="text-3xl font-extrabold text-red-600">SegurosFlex</h1>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center text-black">Recuperar Contraseña</h2>
        <form onSubmit={handleSubmit}>
        <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
            <input
              type="email"
              className="w-full pl-12 p-3 border rounded-lg bg-gray-100 text-gray-700 focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 p-3 rounded-lg hover:bg-red-700 text-white font-bold flex justify-center items-center mt-4"
          >
            <KeyIcon className="w-5 h-5 mr-2" />
            Enviar enlace de recuperación
          </button>
        </form>
        {message && <p className="text-green-400 mt-4">{message}</p>}
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
