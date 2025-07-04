// Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import Navbar from "../components/Navbar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar,
  ComposedChart, ResponsiveContainer
} from "recharts";

// URL base de la API
const API_REPORTES_URL =
  import.meta.env.VITE_API_REPORTES_URL || "http://localhost:4002/api/GenerarReporte";

// Colores para gráficos de pastel
const defaultPieColors = [
  "#82ca9d",
  "#8884d8",
  "#FFBB28",
  "#FF8042",
  "#0088FE",
  "#FF6699",
];

// Función para formatear valores a moneda peruana (Soles)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
};

interface AlertType {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const Dashboard = () => {
  const navigate = useNavigate();

  // KPIs
  const [kpi, setKpi] = useState({
    totalSiniestros: 0,
    totalPresupuestos: 0,
    promedioPresupuesto: 0,
  });

  // Datos del backend
  const [dataSiniestrosTendencia, setDataSiniestrosTendencia] = useState([]);
  const [dataPresupuestosEstados, setDataPresupuestosEstados] = useState([]);
  const [dataTalleres, setDataTalleres] = useState([]);
  const [dataSiniestrosTipo, setDataSiniestrosTipo] = useState([]);
  const [dataSiniestrosDistrito, setDataSiniestrosDistrito] = useState([]);
  const [dataPresupuestosTendencia, setDataPresupuestosTendencia] = useState([]);

  // Alertas
  const [alert, setAlert] = useState<AlertType | null>(null);

  // Modal PDF y selección de campo
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedCampo, setSelectedCampo] = useState("");

  // Carga de datos al montar el componente
  useEffect(() => {
    // 1. KPIs
    fetch(`${API_REPORTES_URL}/dashboard/resumen`)
      .then((res) => res.json())
      .then((data) => setKpi(data))
      .catch(() =>
        setAlert({ type: "error", message: "Error al obtener KPIs" })
      );

    // 2. Tendencia Mensual de Siniestros
    fetch(`${API_REPORTES_URL}/dashboard/siniestros/tendencia`)
      .then((res) => res.json())
      .then((data) => setDataSiniestrosTendencia(data))
      .catch((err) => console.error(err));

    // 3. Presupuestos por Estado
    fetch(`${API_REPORTES_URL}/dashboard/presupuestos/estados`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = data.map((item: any) => ({
          ...item,
          total: Number(item.total),
          monto_total: Number(item.monto_total),
          porcentaje: Number(item.porcentaje),
        }));
        setDataPresupuestosEstados(parsed);
      })
      .catch((err) => console.error(err));

    // 4. Desglose por Taller
    fetch(`${API_REPORTES_URL}/dashboard/talleres`)
      .then((res) => res.json())
      .then((data) => setDataTalleres(data))
      .catch((err) => console.error(err));

    // 5. Siniestros por Tipo
    fetch(`${API_REPORTES_URL}/dashboard/siniestros/tipo`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = data.map((item: any) => ({
          ...item,
          total: Number(item.total),
          porcentaje: Number(item.porcentaje),
        }));
        setDataSiniestrosTipo(parsed);
      })
      .catch((err) => console.error(err));

    // 6. Siniestros por Distrito
    fetch(`${API_REPORTES_URL}/dashboard/siniestros/distrito`)
      .then((res) => res.json())
      .then((data) => setDataSiniestrosDistrito(data))
      .catch((err) => console.error(err));

    // 7. Tendencia Mensual de Presupuestos
    fetch(`${API_REPORTES_URL}/dashboard/presupuestos/tendencia`)
      .then((res) => res.json())
      .then((data) => setDataPresupuestosTendencia(data))
      .catch((err) => console.error(err));
  }, []);

  // Eje Y fijo para "Tendencia Mensual de Siniestros"
  const yTicks = [0, 5, 10, 15, 20, 25];

  // Formatear fecha a "mm/yyyy"
  const formatMes = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  // Etiqueta personalizada para "Siniestros por Tipo" (fuente reducida)
  const renderCustomPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, payload } = props;
    const RADIAN = Math.PI / 180;
    const labelRadius = outerRadius * 1.2;
    const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={payload.fill}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${payload.tipo_siniestro}: ${payload.porcentaje}%`}
      </text>
    );
  };



  // Generar PDF
  const handleGeneratePdf = () => {
    if (!selectedCampo) {
      setAlert({ type: "error", message: "Por favor, selecciona un tipo de análisis" });
      return;
    }
    window.open(`${API_REPORTES_URL}/pdf?campo=${selectedCampo}`, "_blank");
    setModalIsOpen(false);
  };

  return (
    <>
      <Navbar />
      <div className="p-8 min-h-screen bg-gradient-to-br from-white via-gray-100 to-red-50 text-gray-900 pt-24">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Encabezado centrado */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/dashboard/admin")}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          >
            <ArrowLeft size={18} />
            Regresar
          </button>
          <h1 className="flex-1 text-4xl font-extrabold text-center">
            📋 Reporte General
          </h1>
          <button
            onClick={() => setModalIsOpen(true)}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
          >
            Generar Reporte
          </button>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6 text-center">
            <h2 className="text-xl font-bold">Total Siniestros</h2>
            <p className="text-2xl mt-2">{kpi.totalSiniestros}</p>
          </div>
          <div className="bg-white rounded-xl shadow-xl p-6 text-center">
            <h2 className="text-xl font-bold">Total Presupuestos</h2>
            <p className="text-2xl mt-2">{formatCurrency(kpi.totalPresupuestos)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-xl p-6 text-center">
            <h2 className="text-xl font-bold">Promedio Presupuesto</h2>
            <p className="text-2xl mt-2">{formatCurrency(kpi.promedioPresupuesto)}</p>
          </div>
        </div>

        {/* Gráficos (2 filas x 3 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Tendencia Mensual de Siniestros */}
          <div className="bg-white rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-bold mb-2">
              Tendencia Mensual de Siniestros
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataSiniestrosTendencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="mes"
                  tickFormatter={formatMes}
                  minTickGap={20}
                  tick={{ fontSize: 12 }}
                />
                <YAxis ticks={yTicks} tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={(value: string) => formatMes(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 2. Presupuestos por Estado (pastel) */}
          <div className="bg-white rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-bold mb-2">Presupuestos por Estado</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataPresupuestosEstados}
                  dataKey="porcentaje"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ payload }) =>
                    `${payload.estado}: ${payload.porcentaje}%`
                  }
                >
                  {dataPresupuestosEstados.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={defaultPieColors[index % defaultPieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    if (!props || !props.payload) return [value, name];
                    const { total = 0 } = props.payload;
                    return [`${Number(total)} siniestros`, "Total"];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 3. Desglose por Taller (barras horizontales) - Top 5 */}
          <div className="bg-white rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-bold mb-2">Desglose por Taller (Top 5)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[...dataTalleres]
                  .sort((a: any, b: any) => b.monto_total - a.monto_total)
                  .slice(0, 5)
                }
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis dataKey="taller" type="category" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "monto_total") {
                      return [formatCurrency(Number(value)), "Monto Total"];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="monto_total" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 4. Siniestros por Tipo (pastel) */}
          <div className="bg-white rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-bold mb-2">Siniestros por Tipo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataSiniestrosTipo}
                  dataKey="porcentaje"
                  nameKey="tipo_siniestro"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={renderCustomPieLabel}
                >
                  {dataSiniestrosTipo.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={defaultPieColors[index % defaultPieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    if (!props || !props.payload) return [value, name];
                    const { total = 0 } = props.payload;
                    return [`${Number(total)} siniestros`, "Total"];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 5. Siniestros por Distrito (barras horizontales) - Top 5 */}
          <div className="bg-white rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-bold mb-2">
              Siniestros por Distrito (Top 5)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[...dataSiniestrosDistrito]
                  .sort((a: any, b: any) => b.total - a.total)
                  .slice(0, 5)
                }
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="distrito" type="category" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 6. Tendencia Mensual de Presupuestos (combinado) */}
          <div className="bg-white rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-bold mb-2">
              Tendencia Mensual de Presupuestos
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dataPresupuestosTendencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "total_presupuestos") {
                      return [formatCurrency(Number(value)), "Total Presupuestos"];
                    } else if (name === "promedio_presupuesto") {
                      return [formatCurrency(Number(value)), "Promedio Presupuesto"];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="total_presupuestos"
                  fill="#8884d8"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="promedio_presupuesto"
                  stroke="#ff7300"
                  strokeWidth={3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modal para PDF */}
        {modalIsOpen && (
          <Modal onClose={() => setModalIsOpen(false)}>
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Generar Reporte PDF</h2>
              <p className="mb-2">Selecciona el tipo de análisis:</p>
              <select
                value={selectedCampo}
                onChange={(e) => setSelectedCampo(e.target.value)}
                className="p-2 border border-gray-300 rounded-md mb-4"
              >
                <option value="">-- Selecciona --</option>
                <option value="tendencia">Tendencia Mensual de Siniestros</option>
                <option value="presupuestos_estados">Presupuestos por Estado</option>
                <option value="talleres">Desglose por Taller</option>
                <option value="siniestros_tipo">Siniestros por Tipo</option>
                <option value="siniestros_distrito">Siniestros por Distrito</option>
                <option value="presupuestos_tendencia">Tendencia Mensual de Presupuestos</option>
              </select>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => handleGeneratePdf()}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                >
                  Generar Reporte
                </button>
                <button
                  onClick={() => setModalIsOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
};

export default Dashboard;
