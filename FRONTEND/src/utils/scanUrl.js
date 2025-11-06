// src/utils/scanUrl.js
export function buildScanUrl(documentoFormatado, categoriaRotulo) {
  const notaGet = encodeURIComponent(documentoFormatado);

  const categoriaGet = encodeURIComponent(
    categoriaRotulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // tira acento
      .replace(/[^a-z]/g, '') // só letras
  );

  return `/scan?nota=${notaGet}&categoria=${categoriaGet}`;
}
