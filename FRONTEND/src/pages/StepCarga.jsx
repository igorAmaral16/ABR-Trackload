// src/pages/StepCarga.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { FaCheckCircle } from "react-icons/fa";

import Header from "../components/Header";
import FileInput from "../components/FileInput";
import FeedbackMessage from "../components/FeedbackMessage";
import { savePendingUpload } from "../utils/offlineSync";

import "../styles/UploadPage.css";

export default function StepCarga({ modal = false, onClose, initialDocumentNumber = null }) {
  const navigate = useNavigate();

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [documentNumber, setDocumentNumber] = useState("");
  const [files, setFiles] = useState({
    placa: null,
    carga1: null,
    carga2: null,
  });
  const [resetKey, setResetKey] = useState(0);

  const [feedback, setFeedback] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmStage, setConfirmStage] = useState("ask"); // "ask" | "success"

  const formatDoc = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 2) {
      digits = digits.slice(0, 2) + "-" + digits.slice(2, 8);
    }
    return digits;
  };

  // Preenche automaticamente a partir do parâmetro `nf` e remove o param
  useEffect(() => {
    if (initialDocumentNumber) {
      setDocumentNumber(initialDocumentNumber);
      return;
    }

    const nf = searchParams.get("nf");
    if (!nf) return;
    const formatted = formatDoc(nf);
    if (formatted) {
      setDocumentNumber(formatted);
      // Remove o parâmetro da URL para não gerar redundância no histórico
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDocumentNumber]);

  const handleFileChange = async (field, file, nomeMessage) => {
    if (!file) return;

    setLoadingImage(true);
    setFeedback({
      type: "warning",
      text: `Carregando foto ${nomeMessage}, aguarde...`,
    });

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });

      setFiles((prev) => ({
        ...prev,
        [field]: compressed,
      }));

      setFeedback({
        type: "success",
        text: `Foto ${nomeMessage} carregada com sucesso.`,
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: "Erro ao processar imagem.",
      });
    } finally {
      setLoadingImage(false);
    }
  };

  const handleRemoveFile = (field, nomeMessage) => {
    setFiles((prev) => ({
      ...prev,
      [field]: null,
    }));
    setFeedback({
      type: "warning",
      text: `Foto ${nomeMessage} removida com sucesso.`,
    });
  };

  const validateBeforeSend = () => {
    if (!/^[0-9]{2}-[0-9]{6}$/.test(documentNumber)) {
      return "Formato inválido. Use XX-XXXXXX.";
    }

    const { placa, carga1, carga2 } = files;
    if (!placa || !carga1 || !carga2) {
      return "Envie todas as três imagens (Placa, Carga 1 e Carga 2) antes de continuar.";
    }

    return null;
  };

  const handleOpenConfirmModal = (e) => {
    e.preventDefault();
    const error = validateBeforeSend();
    if (error) {
      setFeedback({ type: "warning", text: error });
      return;
    }
    setConfirmStage("ask");
    setShowConfirmModal(true);
  };

  const resetPage = () => {
    setDocumentNumber("");
    setFiles({ placa: null, carga1: null, carga2: null });
    setFeedback(null);
    setResetKey((k) => k + 1);
  };

  const handleConfirmSend = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!navigator.onLine) {
        const fileToDataUrl = (fileObj) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(fileObj);
          });

        const filesMap = {};
        if (files.placa) filesMap.placa = await fileToDataUrl(files.placa);
        if (files.carga1) filesMap.carga1 = await fileToDataUrl(files.carga1);
        if (files.carga2) filesMap.carga2 = await fileToDataUrl(files.carga2);

        await savePendingUpload({ documentNumber, files: filesMap, meta: { step: "carga" } });

        setFeedback({
          type: "warning",
          text: "Sem conexão. Envio enfileirado e será enviado automaticamente quando a internet for restabelecida.",
        });

        setTimeout(() => {
          setShowConfirmModal(false);
          resetPage();
          setIsSubmitting(false);
          if (onClose) onClose();
        }, 1200);

        return;
      }

      const formData = new FormData();
      formData.append("documentNumber", documentNumber);

      if (files.placa) formData.append("placa", files.placa);
      if (files.carga1) formData.append("carga1", files.carga1);
      if (files.carga2) formData.append("carga2", files.carga2);

      const res = await fetch(import.meta.env.VITE_BACKEND_URL + "/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.message || "Falha no upload.");
      }

      setConfirmStage("success");
      setFeedback(null);

      setTimeout(() => {
        setShowConfirmModal(false);
        resetPage();
        setIsSubmitting(false);
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      const msg = err.message.includes("Failed to fetch")
        ? "Erro de conexão com o servidor."
        : err.message;

      setFeedback({ type: "error", text: msg });
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setConfirmStage("ask");
    }
  };

  const handleCancelModal = () => {
    if (isSubmitting) return;
    setShowConfirmModal(false);
    setConfirmStage("ask");
  };

  return (
    <div className="upload-page">
      {!modal && <Header />}

      <main className="upload-main">
        <div className="upload-card">
          <h1 className="upload-title">Carga</h1>
          <p className="upload-subtitle">
            Informe o número do documento e envie as fotos da placa e da carga.
          </p>

          <form className="upload-form" onSubmit={handleOpenConfirmModal}>
            <div className="upload-form-group">
              <label htmlFor="documentNumber-carga">
                Número do Documento
              </label>
              <input
                id="documentNumber-carga"
                type="text"
                placeholder="Ex: 04-021832"
                value={documentNumber}
                onChange={(e) =>
                  setDocumentNumber(formatDoc(e.target.value))
                }
              />
            </div>

            <FileInput
              label="Foto da Placa do Transporte"
              fileType="foto"
              onChange={(e) =>
                handleFileChange("placa", e.target.files[0], "da Placa")
              }
              onClear={() => handleRemoveFile("placa", "da Placa")}
              resetKey={resetKey}
            />

            <FileInput
              label="Primeira Foto da Carga (Dentro do transporte)"
              fileType="foto"
              onChange={(e) =>
                handleFileChange(
                  "carga1",
                  e.target.files[0],
                  "da Primeira Carga"
                )
              }
              onClear={() =>
                handleRemoveFile("carga1", "da Primeira Carga")
              }
              resetKey={resetKey}
            />

            <FileInput
              label="Segunda Foto da Carga (Dentro do transporte)"
              fileType="foto"
              onChange={(e) =>
                handleFileChange(
                  "carga2",
                  e.target.files[0],
                  "da Segunda Carga"
                )
              }
              onClear={() =>
                handleRemoveFile("carga2", "da Segunda Carga")
              }
              resetKey={resetKey}
            />

            <div className="button-row">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  if (modal) onClose?.();
                  else navigate("/");
                }}
                disabled={isSubmitting || loadingImage}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting || loadingImage}
              >
                {isSubmitting ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>

          {feedback && (
            <FeedbackMessage type={feedback.type} text={feedback.text} />
          )}
        </div>
      </main>

      {showConfirmModal && (
        <div className="send-confirm-backdrop">
          <div
            className="send-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmStage === "ask" && (
              <>
                <h2 className="send-confirm-title">Confirmar envio</h2>
                <p className="send-confirm-text">
                  Deseja enviar as fotos de <strong>Carga</strong> para o
                  documento <strong>{documentNumber}</strong>?
                </p>
                <div className="send-confirm-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleCancelModal}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleConfirmSend}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Confirmar"}
                  </button>
                </div>
              </>
            )}

            {confirmStage === "success" && (
              <div className="send-confirm-success">
                <div className="send-confirm-icon-circle">
                  <FaCheckCircle className="send-confirm-icon" />
                </div>
                <p>Envio concluído com sucesso!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
