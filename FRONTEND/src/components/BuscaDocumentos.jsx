// src/components/BuscaDocumentos.jsx
import { useState, useEffect } from 'react';

function getHojeISO() {
  const hoje = new Date();
  const year = hoje.getFullYear();
  const month = String(hoje.getMonth() + 1).padStart(2, '0');
  const day = String(hoje.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BuscaDocumentos({ onSubmit, initialFilters }) {
  const [nota, setNota] = useState(initialFilters?.nota || '');
  const [data, setData] = useState(initialFilters?.data || getHojeISO());

  useEffect(() => {
    if (initialFilters?.nota !== undefined) {
      setNota(initialFilters.nota);
    }
    if (initialFilters?.data !== undefined) {
      setData(initialFilters.data || getHojeISO());
    }
  }, [initialFilters]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nota: nota.trim(),
      data: data || null,
    });
  };

  return (
    <form className="filtro-form" onSubmit={handleSubmit}>
      <input
        type="text"
        name="filtro_nota"
        placeholder="Filtrar por número da nota"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
      <input
        type="date"
        name="filtro_data"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <button type="submit">Filtrar</button>
    </form>
  );
}
