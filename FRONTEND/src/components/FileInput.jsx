// src/components/FileInput.jsx
import { useRef } from "react";
import { FaImage, FaTrash } from "react-icons/fa";

export default function FileInput({
  label,
  fileType = "default",
  onChange,
  onClear,
}) {
  const inputRef = useRef(null);
  const isImage = fileType === "foto";

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="file-input">
      <label className="file-input-label">{label}</label>

      <button
        type="button"
        className="file-input-btn"
        onClick={handleClick}
      >
        <FaImage />
        <span>Escolher da galeria</span>
      </button>

      {onClear && (
        <button
          type="button"
          className="file-input-clear"
          onClick={onClear}
        >
          <FaTrash /> Remover
        </button>
      )}

      {/* Input real, escondido, sem capture (não força câmera) */}
      <input
        ref={inputRef}
        type="file"
        accept={isImage ? "image/*" : undefined}
        // NÃO coloque "capture" aqui
        onChange={onChange}
        style={{ display: "none" }}
      />

      <p className="file-input-hint">
        Toque em “Escolher da galeria” para usar uma foto já existente.
      </p>
    </div>
  );
}
