//import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FiClipboard } from 'react-icons/fi';
import apiClient from '../services/apiClient';

const GenerateReport = () => {
  // Función para generar el reporte de beneficiarios
  const generateBeneficiaryReport = async () => {
    try {
      const response = await apiClient.get<any>('/api/beneficiarios');
      const beneficiarios = response.data;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Beneficiarios');

      // Definir las columnas para el reporte con nombres personalizados
      worksheet.columns = [
        { header: 'ID Beneficiario', key: 'beneficiarioid' },
        { header: 'Nombre', key: 'nombre' },
        { header: 'Apellido', key: 'apellido' },
        { header: 'Email', key: 'email' },
        { header: 'Teléfono', key: 'telefono' },
        { header: 'DNI', key: 'dni' },
      ];

      // Personalizar los encabezados (headers)
      worksheet.getRow(1).eachCell((cell) => {
        // Color de fondo del header
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4CAF50' }, // color de fondo, en formato ARGB
        };

        // Color de texto
        cell.font = {
          color: { argb: 'FFFFFFFF' }, // color de la fuente (blanco)
          bold: true, // poner el texto en negrita
        };

        // Alineación del texto (opcional)
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };
      });

      // Agregar datos a las filas
      beneficiarios.forEach((beneficiario: any) => {
        worksheet.addRow(beneficiario);
      });

      // Escribir el archivo en formato Excel
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'Reporte_Beneficiarios.xlsx');
    } catch (error) {
      console.error('Error generando el reporte:', error);
    }
  };

  return (
    <button
      className="flex items-center space-x-2 p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white"
      onClick={generateBeneficiaryReport}
    >
      <FiClipboard />
      <span>Generar reporte de beneficiarios</span>
    </button>
  );
};

export default GenerateReport;