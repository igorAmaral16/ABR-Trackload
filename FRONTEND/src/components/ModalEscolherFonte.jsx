import { FaCamera, FaImage, FaTimes } from "react-icons/fa";
import "../styles/ModalEscolherFonte.css";

export default function ModalEscolherFonte({
    isOpen,
    onClose,
    onGaleria,
    onCamera,
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-fonte-backdrop" onClick={onClose}>
            <div
                className="modal-fonte-container"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="modal-fonte-header">
                    <h2 className="modal-fonte-title">Escolher foto</h2>
                    <button
                        type="button"
                        className="modal-fonte-close"
                        onClick={onClose}
                        aria-label="Fechar"
                    >
                        <FaTimes />
                    </button>
                </header>

                <p className="modal-fonte-text">
                    Escolha de onde deseja obter a foto:
                </p>

                <div className="modal-fonte-options">
                    <button
                        type="button"
                        className="modal-fonte-option galeria"
                        onClick={onGaleria}
                    >
                        <div className="modal-fonte-icon-wrap">
                            <FaImage className="modal-fonte-icon" />
                        </div>
                        <span className="modal-fonte-option-label">Galeria</span>
                    </button>

                    <button
                        type="button"
                        className="modal-fonte-option camera"
                        onClick={onCamera}
                    >
                        <div className="modal-fonte-icon-wrap">
                            <FaCamera className="modal-fonte-icon" />
                        </div>
                        <span className="modal-fonte-option-label">Câmera</span>
                    </button>
                </div>

                <div className="modal-fonte-footer">
                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
