import imageCompression from "browser-image-compression";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import FileInput from "../components/FileInput";
import FeedbackMessage from "../components/FeedbackMessage";
import { useState } from "react";

export default function StepCarga({
  documentNumber,
  formData,
  setFormData,
  onNext,
  onBack,
  onClear,
}) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (field, file, nomeMessage) => {
    if (!file) return;

    setLoading(true);
    setFeedback({
      type: "warning",
      text: `Carregando ${nomeMessage}, aguarde...`,
    });

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });

      setFormData((prev) => ({
        ...prev,
        carga: { ...prev.carga, [field]: compressed },
      }));

      setFeedback({
        type: "success",
        text: `Foto ${nomeMessage} carregada com sucesso.`,
      });
    } catch {
      setFeedback({ type: "error", text: "Erro ao processar imagem." });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (field, nomeMessage) => {
    onClear("carga", field);
    setFeedback({
      type: "warning",
      text: `Foto ${nomeMessage} removida com sucesso.`,
    });
  };

  const handleNextStep = () => {
    const { placa, carga1, carga2 } = formData.carga;
    if (!placa || !carga1 || !carga2) {
      return setFeedback({
        type: "warning",
        text: "Envie todas as três imagens antes de prosseguir.",
      });
    }
    onNext();
  };

  return (
    <>
      <h1>Etapa 2 — Carga</h1>
      <p>
        <strong>Documento:</strong> {documentNumber}
      </p>

      <FileInput
        label="Foto da Placa"
        fileType="foto"
        onChange={(e) =>
          handleFileChange("placa", e.target.files[0], "da Placa")
        }
        onClear={() => handleRemoveFile("placa", "da Placa")}
      />

      <FileInput
        label="Primeira Foto da Carga"
        fileType="foto"
        onChange={(e) =>
          handleFileChange("carga1", e.target.files[0], "da Primeira Carga")
        }
        onClear={() => handleRemoveFile("carga1", "da Primeira Carga")}
      />

      <FileInput
        label="Segunda Foto da Carga"
        fileType="foto"
        onChange={(e) =>
          handleFileChange("carga2", e.target.files[0], "da Segunda Carga")
        }
        onClear={() => handleRemoveFile("carga2", "da Segunda Carga")}
      />

      <div className="button-row">
        <button type="button" onClick={onBack}>
          <FaArrowLeft /> Voltar
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          disabled={loading}
          className="primary-btn"
        >
          {loading ? "Carregando..." : <>Próxima Etapa <FaArrowRight /></>}
        </button>
      </div>

      {feedback && (
        <FeedbackMessage type={feedback.type} text={feedback.text} />
      )}
    </>
  );
}
