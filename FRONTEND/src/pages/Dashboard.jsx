import { useNavigate } from "react-router-dom";
import { FaTruckLoading, FaSearch } from "react-icons/fa";
import "../styles/Dashboard.css";
import Logo from "../assets/LogoAbr.png";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <img src={Logo} alt="Logo ABR" className="dashboard-logo" />
      </header>

      <main className="dashboard-container">
        <h1 className="dashboard-title">Painel de Acesso</h1>
        <p className="dashboard-subtitle">
          Selecione abaixo a opção desejada:
        </p>

        <div className="dashboard-options">
          <button
            className="dashboard-card"
            onClick={() => navigate("/upload")}
          >
            <div className="icon-container">
              <FaTruckLoading className="icon" />
            </div>
            <h2>Despacho de Carga</h2>
            <p>Envie e gerencie os documentos do processo de despacho.</p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => navigate("/consulta")}
          >
            <div className="icon-container">
              <FaSearch className="icon" />
            </div>
            <h2>Consulta de Documentos</h2>
            <p>Visualize e acompanhe os documentos já enviados.</p>
          </button>
        </div>
      </main>
    </div>
  );
}
