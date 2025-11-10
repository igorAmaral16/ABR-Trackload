import "../styles/Modal.css";
import { FaTimes, FaUpload } from "react-icons/fa";

export default function Modal({
  modalData,
  onClose,
  onReplace,
  fileInputRef,
  isConfirm,
  title,
  message,
  onConfirm,
  isDocEdit,
  docInputRef,
  defaultValue,
}) {
  if (isConfirm) {
    return (
      <div className="modal-overlay">
        <div className="modal-box confirm">
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary-btn" onClick={onConfirm}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDocEdit) {
    return (
      <div className="modal-overlay">
        <div className="modal-box confirm">
          <h3>{title}</h3>
          <input
            ref={docInputRef}
            type="text"
            defaultValue={defaultValue}
            placeholder="Ex: 04-021832"
            className="doc-edit-input"
          />
          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary-btn" onClick={onConfirm}>
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <img src={modalData.url} alt="Visualização" />
        <div className="modal-actions">
          <button
            className="primary-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FaUpload /> Substituir Imagem
          </button>
          <button className="secondary-btn" onClick={onClose}>
            <FaTimes /> Fechar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onReplace}
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
