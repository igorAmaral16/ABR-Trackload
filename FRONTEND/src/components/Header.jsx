// src/components/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaSearch, FaUpload, FaBars, FaTimes } from "react-icons/fa";
import Logo from "../assets/LogoAbr.png";
import ModalEscolherTipo from "./ModalEscolherTipo";
import "../styles/Header.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const navRef = useRef(null);
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });

  // marca ativo para "/upload" e sub-rotas de upload
  const isActive = (path) =>
    path === "/upload"
      ? location.pathname.startsWith("/upload")
      : location.pathname === path;

  const goTo = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const openUploadModal = () => {
    setModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleChooseConferencia = () => {
    setModalOpen(false);
    navigate("/upload/conferencia");
  };
  const handleChooseCarga = () => {
    setModalOpen(false);
    navigate("/upload/carga");
  };
  const handleChooseCanhoto = () => {
    setModalOpen(false);
    navigate("/upload/canhoto");
  };

  // indicador ativo
  const updateIndicator = () => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector(".nav-btn.active");
    if (!activeBtn) {
      setIndicator({ width: 0, left: 0 });
      return;
    }
    const rect = activeBtn.getBoundingClientRect();
    const parentRect = navRef.current.getBoundingClientRect();
    setIndicator({
      width: Math.round(rect.width),
      left: Math.round(rect.left - parentRect.left),
    });
  };

  useEffect(() => {
    updateIndicator();
    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, mobileMenuOpen]);

  // scroll effect
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // fecha mobile ao navegar por rota
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  return (
    <>
      <header className={`header-container ${isScrolled ? "scrolled" : ""}`}>
        <div className="header-content">
          <div
            className="header-brand"
            onClick={() => {
              goTo("/");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && goTo("/")}
            aria-label="Ir para início"
          >
            <img src={Logo} alt="Logo ABR - Sistema de Documentos" id="logo" />
            <div className="brand-text">
              <span className="brand-name">ABR Integra</span>
              <span className="brand-tagline">Gestão de Documentos</span>
            </div>
          </div>

          <nav className="header-nav desktop-nav" ref={navRef} aria-label="Navegação principal">
            {/* indicador posicionado dinamicamente */}
            <div
              className="nav-indicator"
              style={{
                width: indicator.width ? `${indicator.width}px` : 0,
                transform: `translateX(${indicator.left}px)`,
              }}
              aria-hidden
            />

            <button
              onClick={() => goTo("/")}
              className={`nav-btn ${isActive("/") ? "active" : ""}`}
              aria-label="Página inicial"
            >
              <FaHome className="nav-icon" />
              <span className="nav-text">Início</span>
            </button>

            <button
              onClick={() => goTo("/consulta")}
              className={`nav-btn ${isActive("/consulta") ? "active" : ""}`}
              aria-label="Consultar documentos"
            >
              <FaSearch className="nav-icon" />
              <span className="nav-text">Consultar</span>
            </button>

            <button
              onClick={openUploadModal}
              className={`nav-btn primary ${isActive("/upload") ? "active" : ""}`}
              aria-haspopup="dialog"
              aria-expanded={modalOpen}
              aria-controls="modal-escolher-tipo"
            >
              <FaUpload className="nav-icon" />
              <span className="nav-text">Novo Upload</span>
            </button>
          </nav>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((s) => !s)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className={`mobile-nav-container ${mobileMenuOpen ? "open" : ""}`}>
            <nav className="mobile-nav" aria-label="Navegação móvel">
              <button
                onClick={() => goTo("/")}
                className={`nav-btn ${isActive("/") ? "active" : ""}`}
              >
                <FaHome className="nav-icon" />
                <span className="nav-text">Início</span>
              </button>

              <button
                onClick={() => goTo("/consulta")}
                className={`nav-btn ${isActive("/consulta") ? "active" : ""}`}
              >
                <FaSearch className="nav-icon" />
                <span className="nav-text">Consultar</span>
              </button>

              <button
                onClick={openUploadModal}
                className={`nav-btn primary ${isActive("/upload") ? "active" : ""}`}
              >
                <FaUpload className="nav-icon" />
                <span className="nav-text">Novo Upload</span>
              </button>
            </nav>
          </div>

          {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
        </div>
      </header>

      <ModalEscolherTipo
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConferencia={handleChooseConferencia}
        onCarga={handleChooseCarga}
        onCanhoto={handleChooseCanhoto}
      />
    </>
  );
}
