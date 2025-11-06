// src/components/DocumentTable.jsx
import ImageThumbnail from './ImageThumbnail';
import { buildScanUrl } from '../utils/scanUrl';

// categorias exibidas nas colunas
const CATEGORIAS = ['Conferência', 'Carga', 'Canhoto'];

export default function DocumentTable({ documentos, scanEnabled, onThumbnailClick }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Data</th>
            <th>Cliente</th>
            {CATEGORIAS.map((cat) => (
              <th key={cat}>{cat}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documentos.length === 0 && (
            <tr>
              <td colSpan={3 + CATEGORIAS.length}>Nenhum documento encontrado.</td>
            </tr>
          )}

          {documentos.map((doc) => (
            <tr key={doc.documentoFormatado}>
              <td>{doc.documentoFormatado}</td>
              <td>{doc.dataFormatada}</td>
              <td>{doc.cliente}</td>

              {CATEGORIAS.map((categoria) => {
                const imagensCategoria = doc.imagensPorCategoria?.[categoria] || [];
                const temImagens = imagensCategoria.length > 0;

                if (temImagens) {
                  return (
                    <td key={categoria}>
                      {imagensCategoria.map((imgSrc, idx) => (
                        <ImageThumbnail
                          key={imgSrc}
                          src={imgSrc}
                          alt={`${categoria} - ${doc.documentoFormatado}`}
                          document={doc.documentoFormatado}
                          categoria={categoria}
                          onClick={() =>
                            onThumbnailClick({
                              documento: doc.documentoFormatado,
                              categoria,
                              imagens: imagensCategoria,
                              startIndex: idx,
                            })
                          }
                        />
                      ))}
                    </td>
                  );
                }

                // Sem imagem: mostra "no-image.png", com link pra scan se scanEnabled = true
                const placeholder = (
                  <ImageThumbnail
                    src="/images/no-image.png"
                    alt={`Sem imagem - ${categoria}`}
                    document={doc.documentoFormatado}
                    categoria={categoria}
                    onClick={null}
                  />
                );

                if (!scanEnabled) {
                  return <td key={categoria}>{placeholder}</td>;
                }

                const scanUrl = buildScanUrl(doc.documentoFormatado, categoria);

                return (
                  <td key={categoria}>
                    <a
                      href={scanUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={`Cadastrar imagem para ${doc.documentoFormatado}`}
                    >
                      {placeholder}
                    </a>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
