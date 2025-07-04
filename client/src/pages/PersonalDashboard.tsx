import { useEffect, useState } from "react";
import { FiUsers } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import Layout from "../components/Layout";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const PersonalDashboard = () => {
  const [beneficiariosData, setBeneficiariosData] = useState([]);
  const [polizasData, setPolizasData] = useState([]);
  // const [error, setError] = useState<string | null>(null);
  // const navigate = useNavigate();

  useEffect(() => {
    const fetchBeneficiarios = async () => {
      try {
        const response = await apiClient.get<any>("/api/beneficiarios");
        setBeneficiariosData(response.data);
      } catch (error) {
        console.error("Error al obtener los beneficiarios");
      }
    };

    const fetchPolizas = async () => {
      try {
        const response = await apiClient.get<any>("/api/polizas");
        setPolizasData(response.data);
      } catch (error) {
        console.error("Error al obtener las pólizas");
      }
    };

    fetchBeneficiarios();
    fetchPolizas();
  }, []);


  const policyPrices = {
    Básica: 1000,
    Normal: 2500,
    Premium: 5000,
  };

  const polizaChartData = {
    labels: ["Póliza Básica", "Póliza Normal", "Póliza Premium"],
    datasets: [
      {
        label: "Costo Total de Pólizas por Tipo",
        data: [
          polizasData.filter((p: any) => p.tipopoliza === "Básica").length * policyPrices.Básica,
          polizasData.filter((p: any) => p.tipopoliza === "Normal").length * policyPrices.Normal,
          polizasData.filter((p: any) => p.tipopoliza === "Premium").length * policyPrices.Premium,
        ],
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107"],
      },
    ],
  };

  const totalBeneficiariosData = {
    labels: ["Total de Beneficiarios"],
    datasets: [
      {
        label: "Total de Beneficiarios",
        data: [beneficiariosData.length],
        backgroundColor: ["#FF6384"],
      },
    ],
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-10 px-6 mt-auto">
        
        {/* Panel de Personal con fondo negro y texto blanco */}
        <div className="bg-black p-6 rounded-lg shadow-lg mb-8">
          <h1 className="text-5xl font-bold text-center text-white mb-6">
            <FiUsers className="inline-block mr-2 text-yellow-400" />
            Panel de Personal
          </h1>
          <p className="text-lg text-gray-300 text-center">
            Administra las tareas asignadas y colabora en la gestión de siniestros.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de Distribución de Pólizas por Tipo y Precio */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Costo Total de Pólizas por Tipo</h2>
            <Bar
              data={polizaChartData}
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: "Distribución del Costo de Pólizas",
                  },
                  legend: {
                    position: "top",
                  },
                },
              }}
            />
          </div>

          {/* Gráfico Doughnut de Total de Beneficiarios */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Total de Beneficiarios</h2>
            <Doughnut
              data={totalBeneficiariosData}
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: "Total de Beneficiarios en el Sistema",
                  },
                  legend: {
                    position: "top",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PersonalDashboard;
