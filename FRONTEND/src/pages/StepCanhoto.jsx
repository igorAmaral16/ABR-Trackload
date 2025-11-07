import { useState } from "react";
import imageCompression from "browser-image-compression";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import FileInput from "../components/FileInput";
import FeedbackMessage from "../components/FeedbackMessage";

export default function StepCanhoto({
  documentNumber,
  setFormData,
  onBack,
  onFinish,
}) {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setLoading(true);
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
        text: "Foto do Canhoto carregada com sucesso.",
      });
    } catch {
      setFeedback({ type: "error", text: "Erro ao processar imagem." });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFeedback({
      type: "warning",
      text: "Foto do Canhoto removida com sucesso.",
    });
  };

  const handleFinish = () => {
    if (!file) {
      setFeedback({
        type: "warning",
        text: "Envie a foto do canhoto antes de finalizar.",
      });
      return;
    }
    setFormData((prev) => ({ ...prev, canhoto: file }));
    onFinish();
  };

  return (
    <>
      <h1>Etapa 3 — Canhoto</h1>
      <p>
        <strong>Documento:</strong> {documentNumber}
      </p>

      <FileInput
        label="Foto do Canhoto"
        fileType="foto"
        onChange={handleFileChange}
        onClear={handleRemoveFile}
      />

      <div className="button-row">
        <button type="button" onClick={onBack}>
          <FaArrowLeft /> Voltar
        </button>
        <button
          type="button"
          onClick={handleFinish}
          disabled={loading}
          className="primary-btn"
        >
          {loading ? "Carregando..." : <>Finalizar e Enviar <FaCheck /></>}
        </button>
      </div>

      {feedback && <FeedbackMessage type={feedback.type} text={feedback.text} />}
    </>
  );
}
