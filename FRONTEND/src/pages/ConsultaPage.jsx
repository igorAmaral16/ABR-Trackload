import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaImages,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import formatDate, { parseToDate } from "../utils/formatDate";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "../styles/ConsultaDocumentos.css";

export default function ConsultaDocumentos() {
  // cache + data
  const [documentsCache, setDocumentsCache] = useState([]); // full cached set
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingFilterDate, setPendingFilterDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [pendingSortOrder, setPendingSortOrder] = useState("desc");
  const [pendingOnlyComplete, setPendingOnlyComplete] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    searchType: "ambos",
    data: "",
    sortOrder: "desc",
    onlyComplete: false,
  });

  // Modal de preview
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState("conferencia");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const zoomIn = () =>
    setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () =>
    setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
  const resetZoom = () => setZoom(1);

  const navigate = useNavigate();

  // Carrega cache / API
  useEffect(() => {
    const CACHE_KEY = "documentos_cache_v1";
    const CACHE_TTL_MS = 1000 * 60 * 60 * 1; // 1h

    async function fetchAndCache() {
      setLoading(true);
      setError("");
      try {
        const url =
          import.meta.env.VITE_BACKEND_URL + "/documentos?limit=1000";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erro na resposta da API");
        const data = await res.json();

        const arr = Array.isArray(data) ? data : [];

        const payload = { ts: Date.now(), data: arr };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (e) {
          /* ignore storage errors */
        }

        setDocumentsCache(arr);
        setAppliedFilters({
          search: "",
          searchType: "ambos",
          data: "",
          sortOrder: "desc",
          onlyComplete: false,
        });
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar documentos.");
      } finally {
        setLoading(false);
      }
    }

    try {
      const raw = localStorage.getItem("documentos_cache_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          parsed.ts &&
          Date.now() - parsed.ts < CACHE_TTL_MS &&
          Array.isArray(parsed.data)
        ) {
          setDocumentsCache(parsed.data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // segue para fetch
    }

    fetchAndCache();
  }, []);

  // Fecha modal com ESC e navega com setas
  useEffect(() => {
    if (!previewDoc) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setPreviewDoc(null);
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDoc, activePreviewTab, activeImageIndex]);

  // Fecha fullscreen com ESC
  useEffect(() => {
    function handleFsKey(e) {
      if (e.key === "Escape") setFullscreenImage(null);
    }
    window.addEventListener("keydown", handleFsKey);
    return () => window.removeEventListener("keydown", handleFsKey);
  }, []);

  const toggleFilters = () => {
    setFiltersOpen((prev) => !prev);
  };

  const openPreview = (doc, tab = "conferencia") => {
    setPreviewDoc(doc);
    setActivePreviewTab(tab);
    setActiveImageIndex(0);
    resetZoom();
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setActiveImageIndex(0);
    resetZoom();
  };

  const isDocComplete = (doc) => {
    const imgs = doc.imagens || {};
    return (
      imgs.conferencia?.length > 0 &&
      imgs.carga?.length > 0 &&
      imgs.canhoto?.length > 0
    );
  };

  const getActiveImageList = (doc, tab) => {
    if (!doc) return [];
    const imagens = doc.imagens || {};
    if (tab === "conferencia") return imagens.conferencia || [];
    if (tab === "carga") return imagens.carga || [];
    return imagens.canhoto || [];
  };

  // heurística pra saber se busca é por NF ou Cliente
  const detectSearchType = (q) => {
    if (!q) return "ambos";
    const hasLetter = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(q);
    const hasDigit = /\d/.test(q);
    if (hasDigit && !hasLetter) return "nota";
    if (!hasDigit && hasLetter) return "cliente";
    const digitsCount = (q.match(/\d/g) || []).length;
    const lettersCount = (q.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
    return digitsCount >= lettersCount ? "nota" : "cliente";
  };

  const handlePrevImage = () => {
    if (!previewDoc) return;
    const list = getActiveImageList(previewDoc, activePreviewTab);
    if (!list.length) return;

    setActiveImageIndex((prev) =>
      prev <= 0 ? list.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!previewDoc) return;
    const list = getActiveImageList(previewDoc, activePreviewTab);
    if (!list.length) return;

    setActiveImageIndex((prev) =>
      prev >= list.length - 1 ? 0 : prev + 1
    );
  };

  // Filtro em memória
  const filteredDocs = useMemo(() => {
    let result = [...documentsCache];

    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      const type = appliedFilters.searchType || "ambos";
      result = result.filter((d) => {
        const nf = String(d.nf || "").toLowerCase();
        const cliente = String(d.cliente || "").toLowerCase();
        if (type === "nota") return nf.includes(q);
        if (type === "cliente") return cliente.includes(q);
        return nf.includes(q) || cliente.includes(q);
      });
    }

    if (appliedFilters.data) {
      result = result.filter(
        (d) => d.data && d.data.startsWith(appliedFilters.data)
      );
    }

    if (appliedFilters.onlyComplete) {
      result = result.filter((doc) => isDocComplete(doc));
    }

    result.sort((a, b) => {
      const da = parseToDate(a.data);
      const db = parseToDate(b.data);
      if (appliedFilters.sortOrder === "asc") return da - db;
      return db - da;
    });

    return result;
  }, [documentsCache, appliedFilters]);

  // Paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocs.length / pageSize)
  );

  const pagedDocs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, page, pageSize]);

  const renderImagesPreview = () => {
    if (!previewDoc) return null;

    const list = getActiveImageList(previewDoc, activePreviewTab);

    if (!list.length) {
      return (
        <div className="preview-empty-imagens">
          Nenhuma imagem encontrada para essa categoria.
        </div>
      );
    }

    const currentIndex =
      activeImageIndex >= list.length ? 0 : activeImageIndex;
    const currentSrc = list[currentIndex];

    return (
      <>
        <div
          className="preview-main"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <button
            type="button"
            className="preview-nav-btn images-btn"
            onClick={handlePrevImage}
            disabled={list.length <= 1}
            aria-label="Anterior"
          >
            <FaChevronLeft />
          </button>

          <div
            className="preview-image-wrap"
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: zoom > 1 ? "auto" : "hidden",
            }}
          >
            <img
              src={currentSrc}
              alt={`${activePreviewTab} ${currentIndex + 1}`}
              className={`preview-image ${zoom > 1 ? "zoomed" : ""
                }`}
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 150ms ease",
                cursor: zoom > 1 ? "grab" : "zoom-in",
              }}
              onDoubleClick={() =>
                zoom === 1 ? zoomIn() : resetZoom()
              }
              onClick={() => setFullscreenImage(currentSrc)}
              draggable={false}
              loading="lazy"
            />
          </div>

          <button
            type="button"
            className="preview-nav-btn images-btn"
            onClick={handleNextImage}
            disabled={list.length <= 1}
            aria-label="Próxima"
          >
            <FaChevronRight />
          </button>
        </div>

        <div
          className="preview-controls"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <div className="preview-counter">
            {list.length > 1
              ? `${currentIndex + 1} de ${list.length}`
              : "1 de 1"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="images-btn"
              onClick={zoomOut}
              aria-label="Diminuir"
            >
              -
            </button>
            <button
              type="button"
              className="images-btn"
              onClick={resetZoom}
              aria-label="Resetar"
            >
              Reset
            </button>
            <button
              type="button"
              className="images-btn"
              onClick={zoomIn}
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
        </div>

        {list.length > 1 && (
          <div
            className="preview-thumbs"
            style={{ marginTop: 10 }}
          >
            {list.map((src, idx) => (
              <button
                key={idx}
                type="button"
                className={`preview-thumb ${idx === currentIndex ? "active" : ""
                  }`}
                onClick={() => setActiveImageIndex(idx)}
              >
                <img
                  src={src}
                  alt={`thumb ${idx + 1}`}
                  style={{
                    width: 90,
                    height: 56,
                    objectFit: "cover",
                  }}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  const applyFilters = () => {
    const q = pendingSearch.trim();
    const type = detectSearchType(q);
    setAppliedFilters({
      search: q,
      searchType: type,
      data: q ? "" : pendingFilterDate,
      sortOrder: pendingSortOrder,
      onlyComplete: pendingOnlyComplete,
    });
    setPage(1);
  };

  const resetFilters = () => {
    setPendingSearch("");
    setPendingFilterDate(new Date().toISOString().slice(0, 10));
    setPendingOnlyComplete(false);
    setPendingSortOrder("desc");
    setAppliedFilters({
      search: "",
      searchType: "ambos",
      data: "",
      sortOrder: "desc",
      onlyComplete: false,
    });
    setPage(1);
  };

  const refreshFromServer = () => {
    localStorage.removeItem("documentos_cache_v1");
    window.location.reload();
  };

  // célula por categoria (Conferência / Carga / Canhoto)
  const renderCategoryCell = (doc, tipo) => {
    const imgs = doc.imagens || {};
    const list = imgs[tipo] || [];
    const has = list.length > 0;

    const label =
      tipo === "conferencia"
        ? "Conferência"
        : tipo === "carga"
          ? "Carga"
          : "Canhoto";

    const handleClick = () => {
      if (has) {
        openPreview(doc, tipo);
      } else {
        navigate(
          `/upload/${tipo}?nf=${encodeURIComponent(doc.nf)}`
        );
      }
    };

    return (
      <td key={tipo} className="img-category-cell">
        <div className="img-status">
          <div
            className={`img-status-pill ${has ? "ok" : "missing"
              }`}
          >
            <span
              className={`img-status-dot ${has ? "ok" : "missing"
                }`}
            />
            <span>{has ? "Imagem enviada" : "Sem imagem"}</span>
          </div>
          <div className="img-status-actions">
            <button
              type="button"
              className="img-status-btn"
              onClick={handleClick}
            >
              {has ? `Ver ${label}` : `Adicionar ${label}`}
            </button>
          </div>
        </div>
      </td>
    );
  };

  return (
    <div className="consulta-page">
      <Header />

      <main className="consulta-container">
        <h1>Consulta de Documentos</h1>

        {/* Barra de busca */}
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por NF ou cliente..."
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyFilters();
              }
            }}
          />
          <button
            type="button"
            className="search-btn"
            title="Buscar"
            onClick={applyFilters}
          >
            <FaSearch />
          </button>
        </div>

        {/* Linha dos filtros */}
        <div className="filters-row">
          <button
            type="button"
            className={`filter-toggle ${filtersOpen ? "active" : ""
              }`}
            onClick={toggleFilters}
          >
            <FaFilter className="filter-icon" />
            <span>Filtros</span>
          </button>
          <span className="filters-summary">
            {appliedFilters.sortOrder === "desc"
              ? "Mais recentes primeiro"
              : "Mais antigos primeiro"}
            {appliedFilters.search
              ? ` · Buscando por "${appliedFilters.search}" (${appliedFilters.searchType === "nota"
                ? "NF"
                : appliedFilters.searchType === "cliente"
                  ? "Cliente"
                  : "NF ou Cliente"
              })`
              : appliedFilters.data
                ? ` · Data ${formatDate(appliedFilters.data)}`
                : ""}
            {appliedFilters.onlyComplete
              ? " · Somente NF completas"
              : ""}
          </span>
        </div>

        {/* Painel de filtros */}
        {filtersOpen && (
          <section className="filters-panel">
            <div className="filter-group">
              <span className="filter-label">Data</span>
              <div className="filter-dates">
                <label>
                  Selecionar
                  <input
                    type="date"
                    value={pendingFilterDate}
                    onChange={(e) =>
                      setPendingFilterDate(e.target.value)
                    }
                    disabled={pendingSearch.trim() !== ""}
                  />
                </label>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Ordenar por</span>
              <div className="filter-order">
                <label>
                  <input
                    type="radio"
                    name="sortOrder"
                    value="desc"
                    checked={pendingSortOrder === "desc"}
                    onChange={() => setPendingSortOrder("desc")}
                  />{" "}
                  Data (mais recentes primeiro)
                </label>
                <label>
                  <input
                    type="radio"
                    name="sortOrder"
                    value="asc"
                    checked={pendingSortOrder === "asc"}
                    onChange={() => setPendingSortOrder("asc")}
                  />{" "}
                  Data (mais antigos primeiro)
                </label>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Integridade</span>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={pendingOnlyComplete}
                  onChange={(e) =>
                    setPendingOnlyComplete(e.target.checked)
                  }
                />
                Mostrar apenas NF com Conferência, Carga e Canhoto
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  className="images-btn"
                  onClick={applyFilters}
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  className="images-btn"
                  onClick={resetFilters}
                  style={{ background: "#fff" }}
                >
                  Limpar
                </button>
                <button
                  type="button"
                  className="images-btn"
                  onClick={refreshFromServer}
                >
                  Atualizar
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Estado de carregamento / erro */}
        {loading && (
          <div className="info-state">Carregando documentos...</div>
        )}
        {error && <div className="info-state error">{error}</div>}

        {/* Tabela */}
        {!loading && !error && (
          <div className="table-wrapper">
            {/* Legenda das categorias */}
            <div className="images-legend">
              <span className="legend-item">
                <span className="legend-dot ok" />
                Possui imagem
              </span>
              <span className="legend-item">
                <span className="legend-dot missing" />
                Sem imagem (clique em "Adicionar")
              </span>
            </div>

            <table className="consulta-table">
              <thead>
                <tr>
                  <th>N° NF</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Conferência</th>
                  <th>Carga</th>
                  <th>Canhoto</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length > 0 ? (
                  pagedDocs.map((doc, idx) => (
                    <tr key={idx}>
                      <td>{doc.nf}</td>
                      <td>
                        {formatDate(doc.data, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td>{doc.cliente}</td>
                      {renderCategoryCell(doc, "conferencia")}
                      {renderCategoryCell(doc, "carga")}
                      {renderCategoryCell(doc, "canhoto")}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-results">
                      Nenhum documento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Paginação */}
            <div className="pagination-wrapper">
              <div className="pagination-controls-center">
                <button
                  className="page-btn-control"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  aria-label="Primeira página"
                >
                  «
                </button>
                <button
                  className="page-btn-control"
                  onClick={() =>
                    setPage((p) => Math.max(1, p - 1))
                  }
                  disabled={page === 1}
                  aria-label="Página anterior"
                >
                  ‹
                </button>

                <span className="page-current-indicator">
                  Página {page} de {totalPages}
                </span>

                <button
                  className="page-btn-control"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                  disabled={page === totalPages}
                  aria-label="Próxima página"
                >
                  ›
                </button>
                <button
                  className="page-btn-control"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  aria-label="Última página"
                >
                  »
                </button>
              </div>

              <div className="pagination-details">
                <div className="pagination-info">
                  Mostrando {pagedDocs.length} de{" "}
                  {filteredDocs.length} registros
                </div>

                <div className="page-size-controls">
                  <label
                    htmlFor="page-size-select"
                    className="page-size-label"
                  >
                    Linhas:
                  </label>
                  <select
                    id="page-size-select"
                    className="page-size-select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de preview de imagens */}
      {previewDoc && (
        <div
          className="preview-modal-backdrop-imagens"
          onClick={closePreview}
        >
          <div
            className="preview-modal-imagens"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="preview-header-imagens">
              <div>
                <h2>NF {previewDoc.nf}</h2>
                <p>{previewDoc.cliente}</p>
              </div>
              <button
                type="button"
                className="preview-close-imagens"
                onClick={closePreview}
                aria-label="Fechar preview"
              >
                <FaTimes />
              </button>
            </header>

            <nav className="preview-tabs-imagens">
              <button
                type="button"
                className={`preview-tab-imagens ${activePreviewTab === "conferencia"
                    ? "active"
                    : ""
                  }`}
                onClick={() => {
                  setActivePreviewTab("conferencia");
                  setActiveImageIndex(0);
                  resetZoom();
                }}
              >
                Conferência
              </button>
              <button
                type="button"
                className={`preview-tab-imagens ${activePreviewTab === "carga" ? "active" : ""
                  }`}
                onClick={() => {
                  setActivePreviewTab("carga");
                  setActiveImageIndex(0);
                  resetZoom();
                }}
              >
                Carga
              </button>
              <button
                type="button"
                className={`preview-tab-imagens ${activePreviewTab === "canhoto" ? "active" : ""
                  }`}
                onClick={() => {
                  setActivePreviewTab("canhoto");
                  setActiveImageIndex(0);
                  resetZoom();
                }}
              >
                Canhoto
              </button>
            </nav>

            <section className="preview-content-imagens">
              {renderImagesPreview()}
            </section>
          </div>
        </div>
      )}

      {/* Fullscreen expanded image */}
      {fullscreenImage && (
        <div
          className="fs-backdrop-imagens"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            alt="Expandida"
            className="fs-image-imagens"
            onClick={() => setFullscreenImage(null)}
          />
        </div>
      )}
    </div>
  );
}
