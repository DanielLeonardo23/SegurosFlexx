import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements as StripeElements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { FaShieldAlt } from 'react-icons/fa';
import apiClient from '../services/apiClient';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';


const Policies = () => {
  const navigate = useNavigate();
  const { user, createPolicy } = useAuth();
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(null);

  const stripePromise = loadStripe('pk_test_51Qol4rAkA9dBfeWxoAuj2g6TZwwsnPCYEo5irLHfl4vpyl2C4O3rSB9fTSJBiMsb38dRvAFdKKvpFSktk0je5Nuc00olzhFV12');

  // Función para manejar la selección de la póliza
  const handleSelectPolicy = async (policy: string) => {
    if (!user) return;

    setSelectedPolicy(policy);

    try {
      const response = await apiClient.post<any>('/api/pagos/create-payment-intent', {
        amount: getAmountForPolicy(policy),
      });

      setPaymentIntent(response.data.clientSecret);
    } catch (error) {
      setErrorMessage('Error al procesar el pago. Intenta nuevamente.');
      console.error('Error en la creación del pago:', error);
      setTimeout(() => {
        navigate('/dashboard/general');
      }, 3000);
    }
  };

  // Función para obtener el monto según la póliza seleccionada
  const getAmountForPolicy = (policy: string) => {
    switch (policy) {
      case 'Básica':
        return 1000;
      case 'Normal':
        return 2500;
      case 'Premium':
        return 5000;
      default:
        return 0;
    }
  };

  // Función para manejar el éxito del pago y crear la póliza
  const handlePaymentSuccess = async (policy: string) => {
    try {
      if (user) {
        toast.success(`Pago exitoso para la póliza: ${policy}`);
        await createPolicy(user.UsuarioID, policy);
        toast.success(`¡Póliza ${policy} creada con éxito!`);
      } else {
        setErrorMessage('Usuario no autenticado. Intenta nuevamente.');
      }
      navigate('/dashboard/general');
    } catch (error) {
      setErrorMessage('Error al crear la póliza. Intenta nuevamente.');
      console.error('Error al crear la póliza:', error);
      toast.error('Error al crear la póliza. Intenta nuevamente.'); // Manejamos el error con toast
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br bg-white text-white min-h-screen flex flex-col items-center p-8">
        <h1 className="flex items-center justify-center text-white text-4xl font-extrabold mb-12 bg-black p-6 rounded-xl shadow-lg">
          <FaShieldAlt className="mr-4 text-white" />
          Elige tu Póliza
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Póliza Básica */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Póliza Básica</h3>
            <p className="text-gray-600 mb-4">Cobertura básica con beneficios esenciales para ti.</p>
            <p className="text-lg font-semibold mb-4 text-gray-800">Costo: <span className="text-green-600">S/100 / mes</span></p>
            <button
              onClick={() => handleSelectPolicy('Básica')}
              className="w-full bg-black hover:bg-red-500 text-white py-2 rounded-lg font-semibold transition"
            >
              Elegir Póliza
            </button>
          </div>

          {/* Póliza Normal */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Póliza Normal</h3>
            <p className="text-gray-600 mb-4">Cobertura intermedia con mayores beneficios y atención preferencial.</p>
            <p className="text-lg font-semibold mb-4 text-gray-800">Costo: <span className="text-green-600">S/250 / mes</span></p>
            <button
              onClick={() => handleSelectPolicy('Normal')}
              className="w-full bg-black hover:bg-red-500 text-white py-2 rounded-lg font-semibold transition"
            >
              Elegir Póliza
            </button>
          </div>

          {/* Póliza Premium */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Póliza Premium</h3>
            <p className="text-gray-600 mb-4">Cobertura premium con atención personalizada y todos los beneficios.</p>
            <p className="text-lg font-semibold mb-4 text-gray-800">Costo: <span className="text-green-600">S/500 / mes</span></p>
            <button
              onClick={() => handleSelectPolicy('Premium')}
              className="w-full bg-black hover:bg-red-500 text-white py-2 rounded-lg font-semibold transition"
            >
              Elegir Póliza
            </button>
          </div>
        </div>

        {selectedPolicy && paymentIntent && (
          <div className="mt-8 w-full max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
            <p className="text-2xl font-bold text-gray-800 text-center mb-6">
              Has seleccionado: <span className="text-indigo-500">{selectedPolicy}</span>
            </p>

            {/* Formulario de pago */}
            <div className="bg-black p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Detalles de Pago</h3>
              <StripeElements stripe={stripePromise}>
                <CheckoutForm
                  clientSecret={paymentIntent}
                  policy={selectedPolicy}
                  onSuccess={handlePaymentSuccess} // Pasamos el callback aquí
                />
              </StripeElements>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 bg-white text-gray-800 border border-red-500 rounded-lg shadow-md max-w-lg mx-auto">
            <h4 className="font-bold text-xl text-red-600">¡Error!</h4>
            <p className="text-lg">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 bg-white text-gray-800 border border-green-500 rounded-lg shadow-md max-w-lg mx-auto">
            <h4 className="font-bold text-xl text-green-600">¡Éxito!</h4>
            <p className="text-lg">{successMessage}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Policies;

