import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaHome, FaSearch, FaUpload, FaBars, FaTimes } from "react-icons/fa";
import Logo from "../assets/LogoAbr.png";
import "../styles/Header.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detecta scroll para efeito de glass morphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fecha menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  const handleLogoClick = () => {
    navigate("/");
    setMobileMenuOpen(false);
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={`header-container ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-content">
        {/* Logo Area */}
        <div className="header-brand" onClick={handleLogoClick}>
          <img src={Logo} alt="Logo ABR - Sistema de Documentos" id="logo" />
          <div className="brand-text">
            <span className="brand-name">ABR System</span>
            <span className="brand-tagline">Gestão de Documentos</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          <button 
            onClick={() => handleNavClick("/")}
            className={`nav-btn ${isActive("/") ? "active" : ""}`}
            aria-label="Página inicial"
          >
            <FaHome className="nav-icon" />
            <span className="nav-text">Início</span>
          </button>
          
          <button 
            onClick={() => handleNavClick("/consulta")}
            className={`nav-btn ${isActive("/consulta") ? "active" : ""}`}
            aria-label="Consultar documentos"
          >
            <FaSearch className="nav-icon" />
            <span className="nav-text">Consultar</span>
          </button>

          <button 
            onClick={() => handleNavClick("/upload")}
            className={`nav-btn primary ${isActive("/upload") ? "active" : ""}`}
            aria-label="Fazer upload de documentos"
          >
            <FaUpload className="nav-icon" />
            <span className="nav-text">Novo Upload</span>
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Mobile Navigation */}
        <div className={`mobile-nav-container ${mobileMenuOpen ? "open" : ""}`}>
          <nav className="mobile-nav">
            <button 
              onClick={() => handleNavClick("/")}
              className={`nav-btn ${isActive("/") ? "active" : ""}`}
            >
              <FaHome className="nav-icon" />
              <span className="nav-text">Início</span>
            </button>
            
            <button 
              onClick={() => handleNavClick("/consulta")}
              className={`nav-btn ${isActive("/consulta") ? "active" : ""}`}
            >
              <FaSearch className="nav-icon" />
              <span className="nav-text">Consultar</span>
            </button>

            <button 
              onClick={() => handleNavClick("/upload")}
              className={`nav-btn primary ${isActive("/upload") ? "active" : ""}`}
            >
              <FaUpload className="nav-icon" />
              <span className="nav-text">Novo Upload</span>
            </button>
          </nav>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
}