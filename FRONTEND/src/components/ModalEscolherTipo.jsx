// src/components/ModalEscolherTipo.jsx
import { FaClipboardCheck, FaTruckLoading, FaFileSignature, FaTimes } from "react-icons/fa";
import "../styles/ModalEscolherTipo.css";

export default function ModalEscolherTipo({
  isOpen,
  onClose,
  onConferencia,
  onCarga,
  onCanhoto,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-type-select-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-type-select"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-type-select-header">
          <h2 className="modal-type-select-title">Escolher tipo de upload</h2>
          <button
            type="button"
            className="modal-type-select-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <FaTimes />
          </button>
        </header>

        <p className="modal-type-select-text">
          Selecione qual etapa deseja acessar:
        </p>

        <div className="modal-type-select-grid">
          <button
            type="button"
            className="modal-type-select-option conferencia"
            onClick={onConferencia}
          >
            <div className="modal-type-select-icon-wrap">
              <FaClipboardCheck className="modal-type-select-icon" />
            </div>
            <div className="modal-type-select-option-body">
              <span className="modal-type-select-option-title">
                Conferência
              </span>
              <span className="modal-type-select-option-desc">
                Envio das imagens de conferência da nota.
              </span>
            </div>
          </button>

          <button
            type="button"
            className="modal-type-select-option carga"
            onClick={onCarga}
          >
            <div className="modal-type-select-icon-wrap">
              <FaTruckLoading className="modal-type-select-icon" />
            </div>
            <div className="modal-type-select-option-body">
              <span className="modal-type-select-option-title">
                Carga
              </span>
              <span className="modal-type-select-option-desc">
                Fotos de placa, carga 1 e carga 2.
              </span>
            </div>
          </button>

          <button
            type="button"
            className="modal-type-select-option canhoto"
            onClick={onCanhoto}
          >
            <div className="modal-type-select-icon-wrap">
              <FaFileSignature className="modal-type-select-icon" />
            </div>
            <div className="modal-type-select-option-body">
              <span className="modal-type-select-option-title">
                Canhoto
              </span>
              <span className="modal-type-select-option-desc">
                Envio do canhoto assinado da nota.
              </span>
            </div>
          </button>
        </div>

        <div className="modal-type-select-footer">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
