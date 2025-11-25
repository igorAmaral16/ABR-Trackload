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
import { formatNota, formatNotaPattern } from "../utils/maskNota";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import StepConferencia from "./StepConferencia";
import StepCarga from "./StepCarga";
import StepCanhoto from "./StepCanhoto";
import "../styles/ConsultaDocumentos.css";

export default function ConsultaDocumentos() {
  // sugestão de data atual
  const today = new Date().toISOString().slice(0, 10);

  // cache + data
  const [documentsCache, setDocumentsCache] = useState([]); // full cached set
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingFilterDate, setPendingFilterDate] = useState(() => today);
  const [pendingSortOrder, setPendingSortOrder] = useState("desc");
  const [pendingOnlyComplete, setPendingOnlyComplete] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    searchType: "ambos",
    data: today, // sempre iniciar com a data atual
    sortOrder: "desc",
    onlyComplete: false,
  });

  // Modal de preview
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState("conferencia");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  // upload modal state when opening upload steps from Consulta
  const [uploadModal, setUploadModal] = useState(null);

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
        // manter data inicial como hoje
        setAppliedFilters((prev) => ({
          ...prev,
          search: "",
          searchType: "ambos",
          data: today,
          sortOrder: "desc",
          onlyComplete: false,
        }));
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
          // garante filtro inicial com data de hoje
          setAppliedFilters((prev) => ({ ...prev, data: today }));
          return;
        }
      }
    } catch (e) {
      // segue para fetch
    }

    fetchAndCache();
  }, [today]);

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

  // Prefetch current image and adjacent images to improve responsiveness
  useEffect(() => {
    if (!previewDoc) return;
    const list = getActiveImageList(previewDoc, activePreviewTab);
    if (!list || !list.length) {
      setImgLoading(false);
      return;
    }

    const currentIndex = activeImageIndex >= list.length ? 0 : activeImageIndex;
    const src = list[currentIndex];
    if (!src) {
      setImgLoading(false);
      return;
    }

    setImgLoading(true);
    let cancelled = false;

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!cancelled) setImgLoading(false);
    };
    img.onerror = () => {
      if (!cancelled) setImgLoading(false);
    };
    img.src = src;

    // prefetch next image
    if (list.length > 1) {
      const next = list[(currentIndex + 1) % list.length];
      const p = new Image();
      p.decoding = 'async';
      p.src = next;
    }

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [previewDoc, activePreviewTab, activeImageIndex]);

  const openPreview = (doc, tab = "conferencia") => {
    setPreviewDoc(doc);
    setActivePreviewTab(tab);
    setActiveImageIndex(0);
    resetZoom();
    setImgLoading(true);
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

  // novo: determina status da linha
  const getDocStatus = (doc) => {
    const imgs = doc.imagens || {};
    const hasConf = (imgs.conferencia || []).length > 0;
    const hasCarga = (imgs.carga || []).length > 0;
    const hasCanhoto = (imgs.canhoto || []).length > 0;
    const total = [hasConf, hasCarga, hasCanhoto].filter(Boolean).length;

    if (total === 3) return "complete";
    if (total === 0) return "missing-all";
    return "missing-some";
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
        const nfRaw = String(d.nf || "");
        const clienteRaw = String(d.cliente || "");

        if (type === "nota") {
          // compare digits-only for nota searches
          const nfDigits = formatNota(nfRaw, true);
          return nfDigits.includes(q);
        }

        if (type === "cliente") {
          const cliente = formatNota(clienteRaw, false).toLowerCase();
          return cliente.includes(q);
        }

        // ambos: check nota (digits) or cliente (text)
        const nfDigits = formatNota(nfRaw, true);
        const cliente = formatNota(clienteRaw, false).toLowerCase();
        return nfDigits.includes(q) || cliente.includes(q);
      });
    }

    // If a date is set, filter by it. If `data` is empty, search across all dates.
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
            <div style={{ position: 'relative', width: '100%' }}>
              {imgLoading && (
                <div className="img-spinner-overlay">
                  <div className="img-spinner" aria-hidden="true" />
                </div>
              )}
              <img
                src={currentSrc}
                alt={`${activePreviewTab} ${currentIndex + 1}`}
                className={`preview-image ${zoom > 1 ? "zoomed" : ""}`}
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
                decoding="async"
                onLoad={() => setImgLoading(false)}
                onError={() => setImgLoading(false)}
              />
            </div>
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
                className={`preview-thumb ${idx === currentIndex ? "active" : ""}`}
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

    // Format the query for consistency (if searching by nota, keep only digits)
    const qFormatted = type === "nota" ? formatNota(q, true) : formatNota(q, false);

    // Update the visible input with the formatted value
    setPendingSearch(qFormatted);

    // If there is a search query, perform the search across all data
    // (do not limit by the selected date). Otherwise, always apply a date.
    const dataToApply = qFormatted ? "" : (pendingFilterDate || today);

    setAppliedFilters({
      search: qFormatted,
      searchType: type,
      data: dataToApply,
      sortOrder: pendingSortOrder,
      onlyComplete: pendingOnlyComplete,
    });
    setPage(1);
  };

  const resetFilters = () => {
    setPendingSearch("");
    setPendingFilterDate(today);
    setPendingOnlyComplete(false);
    setPendingSortOrder("desc");
    setAppliedFilters({
      search: "",
      searchType: "ambos",
      data: today,
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
        const formatDocForStep = (raw) => {
          const digits = String(raw || "").replace(/\D/g, "");
          if (!digits) return "";
          return digits.length > 2 ? digits.slice(0, 2) + "-" + digits.slice(2, 8) : digits;
        };

        const nfFormatted = formatDocForStep(doc.nf);
        // open upload step inside modal when clicking from Consulta
        setUploadModal({ tipo, nf: nfFormatted });
      }
    };

    return (
      <td key={tipo} className="img-category-cell">
        <div className="img-status">
          <div
            className={`img-status-pill ${has ? "ok" : "missing"}`}
          >
            <span
              className={`img-status-dot ${has ? "ok" : "missing"}`}
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
            onChange={(e) => {
              const raw = e.target.value;
              // If contains letters OR whitespace, treat as free text (normalize lightly)
              const hasLetter = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(raw);
              const hasSpace = /\s/.test(raw);
              if (hasLetter || hasSpace) {
                // normalize but preserve a trailing space so the user can continue typing words
                const normalized = formatNota(raw, false);
                const withTrailing = raw.endsWith(" ") ? normalized + " " : normalized;
                setPendingSearch(withTrailing);
              } else {
                // numeric-like input: format to XX-XXXXXX as the user types
                setPendingSearch(formatNotaPattern(raw));
              }
            }}
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
            className={`filter-toggle ${filtersOpen ? "active" : ""}`}
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
              : ""}
            {appliedFilters.data
              ? ` · Data ${formatDate(appliedFilters.data)}`
              : ""}
            {appliedFilters.onlyComplete ? " · Somente NF completas" : ""}
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
                      // nunca permitir vazio: se estiver vazio, usa hoje
                      setPendingFilterDate(e.target.value || today)
                    }
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
            {/* Legenda das categorias + status */}
            <div className="images-legend">
              <span className="legend-item">
                <span className="legend-dot ok" />
                Possui imagem
              </span>
              <span className="legend-item">
                <span className="legend-dot missing" />
                Sem imagem (clique em "Adicionar")
              </span>

              {/* Legenda de status por linha */}
              <span className="legend-item legend-status">
                <span className="status-box complete" /> Concluído
              </span>
              <span className="legend-item legend-status">
                <span className="status-box missing-some" /> Faltando alguma
              </span>
              <span className="legend-item legend-status">
                <span className="status-box missing-all" /> Faltando todas
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
                  pagedDocs.map((doc, idx) => {
                    const status = getDocStatus(doc);
                    return (
                      <tr key={idx} className={status}>
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
                    );
                  })
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

      {/* Modal de upload (abre passos: Conferência / Carga / Canhoto) quando acionado na tela de consulta */}
      {uploadModal && (
        <div className="modal-overlay upload-overlay" onClick={() => setUploadModal(null)}>
          <div
            className="modal-box upload-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>{uploadModal.tipo === "conferencia" ? "Conferência" : uploadModal.tipo === "carga" ? "Carga" : "Canhoto"}</h2>
              <button type="button" className="preview-close-imagens" onClick={() => setUploadModal(null)} aria-label="Fechar modal">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {uploadModal.tipo === "conferencia" && (
                <StepConferencia modal onClose={() => setUploadModal(null)} initialDocumentNumber={uploadModal.nf} />
              )}

              {uploadModal.tipo === "carga" && (
                <StepCarga modal onClose={() => setUploadModal(null)} initialDocumentNumber={uploadModal.nf} />
              )}

              {uploadModal.tipo === "canhoto" && (
                <StepCanhoto modal onClose={() => setUploadModal(null)} initialDocumentNumber={uploadModal.nf} />
              )}
            </div>
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
