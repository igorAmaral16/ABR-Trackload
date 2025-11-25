// src/pages/StepCanhoto.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { FaCheckCircle } from "react-icons/fa";

import Header from "../components/Header";
import FileInput from "../components/FileInput";
import FeedbackMessage from "../components/FeedbackMessage";
import { savePendingUpload } from "../utils/offlineSync";

import "../styles/UploadPage.css";

export default function StepCanhoto({ modal = false, onClose, initialDocumentNumber = null }) {
  const navigate = useNavigate();

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [documentNumber, setDocumentNumber] = useState("");
  const [file, setFile] = useState(null);
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

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setLoadingImage(true);
    setFeedback({
      type: "warning",
      text: "Carregando foto do canhoto, aguarde...",
    });

    try {
      const compressed = await imageCompression(selected, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });
      setFile(compressed);
      setFeedback({
        type: "success",
        text: "Foto do canhoto carregada com sucesso.",
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

  const handleRemoveFile = () => {
    setFile(null);
    setFeedback({
      type: "warning",
      text: "Foto do canhoto removida com sucesso.",
    });
  };

  const validateBeforeSend = () => {
    if (!/^[0-9]{2}-[0-9]{6}$/.test(documentNumber)) {
      return "Formato inválido. Use XX-XXXXXX.";
    }
    if (!file) {
      return "Envie a foto do canhoto antes de continuar.";
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
    setFile(null);
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

        const dataUrl = await fileToDataUrl(file);
        await savePendingUpload({ documentNumber, dataUrl, meta: { step: "canhoto" } });

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
      formData.append("canhoto", file);

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
          <h1 className="upload-title">Canhoto</h1>
          <p className="upload-subtitle">
            Informe o número do documento e envie a foto do canhoto assinado.
          </p>

          <form className="upload-form" onSubmit={handleOpenConfirmModal}>
            <div className="upload-form-group">
              <label htmlFor="documentNumber-canhoto">
                Número do Documento
              </label>
              <input
                id="documentNumber-canhoto"
                type="text"
                placeholder="Ex: 04-021832"
                value={documentNumber}
                onChange={(e) =>
                  setDocumentNumber(formatDoc(e.target.value))
                }
              />
            </div>

            <FileInput
              label="Foto do Canhoto"
              fileType="foto"
              onChange={handleFileChange}
              onClear={handleRemoveFile}
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
                  Deseja enviar a foto de <strong>Canhoto</strong> para o
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
