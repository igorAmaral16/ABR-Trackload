// src/services/documentoService.js
import api from './api';

// Espera que seu back-end devolva algo do tipo:
// [{ documentoFormatado, dataFormatada, cliente, imagensPorCategoria: { 'Conferência': [...], 'Carga': [...], 'Canhoto': [...] } }]
export async function buscarDocumentos({ nota, data, scan = 1 }) {
  const params = {};

  if (nota) params.nota = nota;
  if (data) params.data = data;
  params.scan = scan;

  const response = await api.get('/documentos', { params });
  return response.data; // array de documentos
}
