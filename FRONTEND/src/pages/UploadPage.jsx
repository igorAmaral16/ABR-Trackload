import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import logo from "../assets/LogoAbr.png";
import "../styles/UploadPage.css";

export default function UploadPage() {
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("conferencia");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Quantidade de arquivos por categoria
  const getNumFilesByCategory = (cat) => (cat === "carga" ? 3 : 1);

  // Atualiza inputs quando categoria muda
  useEffect(() => {
    setFiles(Array(getNumFilesByCategory(category)).fill(null));
  }, [category]);

  // Lê parâmetros ?nota=...&categoria=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nota = params.get("nota");
    const categoria = params.get("categoria");
    if (nota) setFileName(nota);
    if (categoria) setCategory(categoria.toLowerCase());
  }, []);

  // Máscara automática XX-XXXXXX
  const formatDocumentNumber = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 2)
      digits = digits.slice(0, 2) + "-" + digits.slice(2, 8);
    return digits;
  };

  const handleFileNameChange = (e) =>
    setFileName(formatDocumentNumber(e.target.value));

  // Compressão e preview
  const handleFileChange = async (index, file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setMessage({
        text: "⚠️ Apenas imagens nos formatos JPG e PNG são aceitas.",
        type: "warning",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        text: "📁 Arquivo muito grande! Tamanho máximo: 5MB.",
        type: "warning",
      });
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
    } catch (err) {
      console.error("Erro ao comprimir imagem:", err);
      setMessage({
        text: "❌ Erro ao processar imagem. Tente novamente ou envie outra foto.",
        type: "error",
      });
    }
  };

  // Validação
  const validate = () => {
    if (!/^[0-9]{2}-[0-9]{6}$/.test(fileName)) {
      setMessage({
        text: "⚠️ Use o formato correto: XX-XXXXXX.",
        type: "warning",
      });
      return false;
    }
    const hasFile = files.some((f) => f && f.compressed);
    if (!hasFile) {
      setMessage({ text: "📁 Envie pelo menos uma imagem.", type: "warning" });
      return false;
    }
    return true;
  };

  // Upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (!validate()) return;

    const formData = new FormData();
    formData.append("fileName", fileName);
    formData.append("category", category);
    files.forEach(
      (f) => f?.compressed && formData.append("fileUpload[]", f.compressed)
    );

    try {
      setUploading(true);
      setProgress(0);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:3000/api/upload", true);
      xhr.timeout = 20000; // 20 segundos

      // Progresso visual
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgress(percent);
        }
      };

      // Resposta do backend
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setMessage({
                text: "✅ Imagens enviadas com sucesso!",
                type: "success",
              });
            } else if (response.error) {
              setMessage({ text: `⚠️ ${response.error}`, type: "warning" });
            } else {
              setMessage({
                text: "⚠️ Resposta inesperada do servidor.",
                type: "warning",
              });
            }
          } catch {
            setMessage({
              text: "✅ Upload concluído, mas resposta inválida do servidor.",
              type: "warning",
            });
          }
          setFileName("");
          setCategory("conferencia");
          setFiles(Array(getNumFilesByCategory("conferencia")).fill(null));
          setProgress(0);
        } else if (xhr.status >= 500) {
          setMessage({
            text: "❌ Erro interno no servidor. Tente novamente mais tarde.",
            type: "error",
          });
        } else if (xhr.status === 413) {
          setMessage({
            text: "⚠️ Arquivo muito grande. Reduza o tamanho e tente novamente.",
            type: "warning",
          });
        } else {
          setMessage({
            text: `❌ Erro ${xhr.status}: falha no envio.`,
            type: "error",
          });
        }
      };

      // Timeout ou falha de conexão
      xhr.ontimeout = () => {
        setUploading(false);
        setMessage({
          text: "⏱️ Tempo de conexão excedido. Verifique sua internet.",
          type: "error",
        });
      };

      xhr.onerror = () => {
        setUploading(false);
        setMessage({
          text: "🌐 Falha na comunicação com o servidor.",
          type: "error",
        });
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Erro inesperado:", error);
      setUploading(false);
      setMessage({
        text: "❌ Erro inesperado ao tentar enviar. Verifique a conexão e tente novamente.",
        type: "error",
      });
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
            <i className="fa-solid fa-upload"></i> Upload de Documentos
          </h1>

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <label htmlFor="fileName">
              <i className="fa-solid fa-file-lines"></i> Número do Documento
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
              <i className="fa-solid fa-layer-group"></i> Categoria
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="conferencia">Conferência</option>
              <option value="carga">Carga</option>
              <option value="canhoto">Canhoto</option>
            </select>

            <div id="fileInputs">
              {files.map((f, idx) => (
                <div className="file-group" key={idx}>
                  <label htmlFor={`fileUpload${idx}`}>
                    <i className="fa-regular fa-image"></i> Escolher Foto{" "}
                    {idx + 1}
                  </label>
                  <input
                    type="file"
                    id={`fileUpload${idx}`}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileChange(idx, e.target.files[0])}
                  />
                  {f?.preview && (
                    <img
                      src={f.preview}
                      alt={`Prévia ${idx + 1}`}
                      className="preview"
                    />
                  )}
                </div>
              ))}
            </div>

            {uploading && (
              <div className="progress-bar">
                <div
                  className="progress"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            <button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Enviando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i> Enviar
                </>
              )}
            </button>
          </form>

          {message.text && (
            <p className={`message ${message.type}`}>{message.text}</p>
          )}
        </div>
      </main>
    </div>
  );
}
