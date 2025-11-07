import { useRef } from "react";
import { FaUpload, FaTimes } from "react-icons/fa";

export default function FileInput({ label, onChange, onClear, fileType }) {
  const inputRef = useRef(null);

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  };

  return (
    <div className="file-input">
      <label className="file-label">{label}</label>
      <div className="file-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onChange}
        />
        <button
          type="button"
          className="clear-btn"
          onClick={handleClear}
          aria-label={`Limpar ${label}`}
        >
          <FaTimes /> Limpar
        </button>
      </div>
      <div className="file-hint">
        <FaUpload /> Selecione uma {fileType || "imagem"}.
      </div>
    </div>
  );
}
