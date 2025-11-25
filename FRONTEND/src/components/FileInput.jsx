// src/components/FileInput.jsx
import { useRef, useEffect, useState } from "react";
import { FaImage, FaTrash } from "react-icons/fa";
import ModalEscolherFonte from "./ModalEscolherFonte";

export default function FileInput({
  label,
  fileType = "default",
  onChange,
  onClear,
  // when `resetKey` changes the input will be cleared (useful after uploads)
  resetKey,
}) {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const isImage = fileType === "foto";
  const [showSourceModal, setShowSourceModal] = useState(false);

  const handleClick = () => {
    setShowSourceModal(true);
  };

  const handleSelectFromGaleria = () => {
    setShowSourceModal(false);
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleSelectFromCamera = () => {
    setShowSourceModal(false);
    if (cameraRef.current) {
      cameraRef.current.click();
    }
  };

  useEffect(() => {
    // clear underlying input when resetKey changes
    try {
      if (inputRef.current) inputRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    } catch (e) {
      /* ignore */
    }
  }, [resetKey]);

  const handleClear = () => {
    try {
      if (inputRef.current) inputRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    } catch (e) { }
    if (typeof onClear === "function") onClear();
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
        <span>Escolher foto</span>
      </button>

      {onClear && (
        <button
          type="button"
          className="file-input-clear"
          onClick={handleClear}
        >
          <FaTrash /> Remover
        </button>
      )}

      {/* Input real para galeria, escondido */}
      <input
        ref={inputRef}
        type="file"
        accept={isImage ? "image/*" : undefined}
        onChange={onChange}
        style={{ display: "none" }}
      />

      {/* Input real para câmera, escondido */}
      <input
        ref={cameraRef}
        type="file"
        accept={isImage ? "image/*" : undefined}
        capture="environment"
        onChange={onChange}
        style={{ display: "none" }}
      />

      <p className="file-input-hint">
        Toque em "Escolher foto" para selecionar da galeria ou usar a câmera.
      </p>

      <ModalEscolherFonte
        isOpen={showSourceModal}
        onClose={() => setShowSourceModal(false)}
        onGaleria={handleSelectFromGaleria}
        onCamera={handleSelectFromCamera}
      />
    </div>
  );
}
