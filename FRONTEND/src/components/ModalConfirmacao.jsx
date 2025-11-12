// src/components/ModalConfirmacao.jsx
import {
  FaCheckCircle,
  FaSearch,
  FaPlusCircle,
  FaTimes,
} from "react-icons/fa";

export default function ModalConfirmacao({
  isOpen,
  documentNumber,
  isSubmitting = false,
  onClose,      // fechar (X ou clicar fora) -> confirmar envio
  onConsultar,  // Consultar Documentos
  onNovaCarga,  // Nova Carga
}) {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (!isSubmitting && onClose) onClose();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const handleCloseButton = () => {
    if (!isSubmitting && onClose) onClose();
  };

  return (
    <div
      className="overlay-modal-confirmacao"
      onClick={handleOverlayClick}
    >
      <div
        className="container-modal-confirmacao"
        onClick={handleContentClick}
      >
        <button
          type="button"
          className="close-modal-confirmacao"
          onClick={handleCloseButton}
          aria-label="Fechar"
          disabled={isSubmitting}
        >
          <FaTimes />
        </button>

        <div className="header-modal-confirmacao">
          <FaCheckCircle className="icon-modal-confirmacao" />
          <h2 className="title-modal-confirmacao">
            {isSubmitting ? "Enviando..." : "Upload preparado!"}
          </h2>
          {documentNumber && (
            <p className="subtitle-modal-confirmacao">
              O documento <strong>{documentNumber}</strong> está pronto para envio.
            </p>
          )}
        </div>

        <div className="body-modal-confirmacao">
          <p className="text-modal-confirmacao">
            Você pode revisar suas opções antes de concluir.
          </p>
        </div>

        <div className="buttons-modal-confirmacao">
          <button
            type="button"
            className="btn-modal-confirmacao btn-secondary-modal-confirmacao"
            onClick={onConsultar}
            disabled={isSubmitting}
          >
            <FaSearch />
            <span>Consultar Documentos</span>
          </button>

          <button
            type="button"
            className="btn-modal-confirmacao btn-primary-modal-confirmacao"
            onClick={onNovaCarga}
            disabled={isSubmitting}
          >
            <FaPlusCircle />
            <span>Nova Carga</span>
          </button>
        </div>
      </div>
    </div>
  );
}
