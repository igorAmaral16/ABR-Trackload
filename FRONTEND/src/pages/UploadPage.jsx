import { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import { uploadFiles } from "../services/api";
import {
  UploadSimple,
  FileText,
  Images,
  PaperPlaneTilt,
  Spinner,
  WarningCircle,
  CheckCircle,
  XCircle,
  Trash,
  ArrowClockwise,
} from "@phosphor-icons/react";
import logo from "../assets/LogoAbr.png";
import "../styles/UploadPage.css";

export default function UploadPage() {
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("conferencia");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const inputRefs = useRef([]); // refs dos inputs p/ reset controlado

  const getNumFilesByCategory = (cat) => (cat === "carga" ? 3 : 1);

  useEffect(() => {
    setFiles(Array(getNumFilesByCategory(category)).fill(null));
  }, [category]);

  const formatDocumentNumber = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 2) digits = digits.slice(0, 2) + "-" + digits.slice(2, 8);
    return digits;
  };

  const handleFileNameChange = (e) =>
    setFileName(formatDocumentNumber(e.target.value));

  const handleFileChange = async (index, file) => {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setMessage({ text: "Apenas imagens JPG e PNG são aceitas.", type: "warning" });
      resetFile(index);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Arquivo muito grande! Tamanho máximo: 5MB.", type: "warning" });
      resetFile(index);
      return;
    }

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };

      const compressed = await imageCompression(file, options);

      const updated = [...files];
      updated[index] = {
        original: file,
        compressed,
        preview: URL.createObjectURL(compressed),
      };
      setFiles(updated);
      setMessage({ text: "", type: "" });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Erro ao processar a imagem. Tente novamente.", type: "error" });
      resetFile(index);
    }
  };

  const resetFile = (index) => {
    const updated = [...files];
    updated[index] = null;
    setFiles(updated);

    if (inputRefs.current[index]) {
      inputRefs.current[index].value = "";
    }
  };

  const clearAll = () => {
    setFileName("");
    setCategory("conferencia");
    setFiles(Array(getNumFilesByCategory("conferencia")).fill(null));
    setMessage({ text: "", type: "" });
    inputRefs.current.forEach((input) => {
      if (input) input.value = "";
    });
  };

  const validate = () => {
    if (!/^[0-9]{2}-[0-9]{6}$/.test(fileName)) {
      setMessage({ text: "Formato inválido: use XX-XXXXXX.", type: "warning" });
      return false;
    }
    if (!files.some((f) => f && f.compressed)) {
      setMessage({ text: "Envie pelo menos uma imagem válida.", type: "warning" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (!validate()) return;

    const formData = new FormData();
    formData.append("fileName", fileName);
    formData.append("category", category);
    files.forEach((f) => f?.compressed && formData.append("fileUpload[]", f.compressed));

    try {
      setUploading(true);
      setProgress(0);

      const response = await uploadFiles(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(percent);
        }
      });

      if (response.success) {
        setMessage({ text: "Imagens enviadas com sucesso!", type: "success" });
        clearAll();
      } else {
        setMessage({
          text: response.error || "Erro ao enviar os arquivos.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} color="#27ae60" />;
      case "error":
        return <XCircle size={20} color="#e74c3c" />;
      case "warning":
        return <WarningCircle size={20} color="#f39c12" />;
      default:
        return null;
    }
  };

  return (
    <div className="upload-page">
      <header className="header-container">
        <img src={logo} alt="Logo da ABR" id="logo" />
      </header>

      <main>
        <div className="container">
          <h1>
            <UploadSimple size={26} /> Upload de Documentos
          </h1>

          <form onSubmit={handleSubmit}>
            <label htmlFor="fileName">
              <FileText size={18} /> Número do Documento
            </label>
            <input
              type="text"
              id="fileName"
              value={fileName}
              onChange={handleFileNameChange}
              placeholder="Ex: 04-021832"
              required
            />
            <small>Use o formato: XX-XXXXXX</small>

            <label htmlFor="category">
              <Images size={18} /> Categoria
            </label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="conferencia">Conferência</option>
              <option value="carga">Carga</option>
              <option value="canhoto">Canhoto</option>
            </select>

            <div className="files-container">
              {files.map((f, idx) => (
                <div className="file-group" key={idx}>
                  <label htmlFor={`fileUpload${idx}`}>
                    <Images size={18} /> Escolher Foto {idx + 1}
                  </label>
                  <input
                    type="file"
                    id={`fileUpload${idx}`}
                    accept="image/*"
                    capture="environment"
                    ref={(el) => (inputRefs.current[idx] = el)}
                    onChange={(e) => handleFileChange(idx, e.target.files[0])}
                  />
                  {f?.preview && (
                    <div className="preview-wrapper">
                      <img src={f.preview} alt={`Prévia ${idx + 1}`} className="preview" />
                      <div className="preview-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          title="Remover"
                          onClick={() => resetFile(idx)}
                        >
                          <Trash size={18} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          title="Trocar Imagem"
                          onClick={() => inputRefs.current[idx]?.click()}
                        >
                          <ArrowClockwise size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {uploading && (
              <div className="progress-bar">
                <div className="progress" style={{ width: `${progress}%` }}></div>
              </div>
            )}

            <div className="actions">
              <button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Spinner size={20} className="spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt size={20} /> Enviar
                  </>
                )}
              </button>

              <button type="button" className="clear-btn" onClick={clearAll} disabled={uploading}>
                <Trash size={18} /> Limpar
              </button>
            </div>
          </form>

          {message.text && (
            <p className={`message ${message.type}`}>
              {renderIcon(message.type)} {message.text}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
