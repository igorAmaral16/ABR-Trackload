import { useEffect, useState, useRef } from "react";
import StepConferencia from "./StepConferencia";
import StepCarga from "./StepCarga";
import StepCanhoto from "./StepCanhoto";
import StepHeader from "../components/StepHeader";
import Modal from "../components/Modal";
import Logo from "../assets/LogoAbr.png";
import "../styles/UploadPage.css";
import { FaCheckCircle, FaRedoAlt, FaEdit } from "react-icons/fa";

export default function UploadFlow() {
  const [step, setStep] = useState(() => Number(localStorage.getItem("step")) || 1);
  const [documentNumber, setDocumentNumber] = useState(localStorage.getItem("documentNumber") || "");
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem("formData");
      return saved ? JSON.parse(saved) : { conferencia: null, carga: {}, canhoto: null };
    } catch {
      localStorage.clear();
      return { conferencia: null, carga: {}, canhoto: null };
    }
  });

  const [modalData, setModalData] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editDocModal, setEditDocModal] = useState(false); // 🔹 modal para editar o número do documento
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Máscara de documento (XX-XXXXXX)
  const formatDoc = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 2) digits = digits.slice(0, 2) + "-" + digits.slice(2, 8);
    return digits;
  };

  // Persistência total
  useEffect(() => {
    const serialized = JSON.stringify(formData, (key, value) => {
      if (value instanceof File || value instanceof Blob)
        return { __file: true, name: value.name };
      return value;
    });

    localStorage.setItem("step", step);
    localStorage.setItem("documentNumber", documentNumber);
    localStorage.setItem("formData", serialized);
  }, [step, documentNumber, formData]);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleClear = (section, field = null) => {
    setFormData((prev) => {
      const updated = { ...prev };
      if (field) updated[section][field] = null;
      else updated[section] = null;
      return updated;
    });
  };

  // Reinício
  const handleReset = () => setConfirmReset(true);

  const confirmResetProcess = () => {
    localStorage.clear();
    setFormData({ conferencia: null, carga: {}, canhoto: null });
    setDocumentNumber("");
    setStep(1);
    setFeedback(null);
    setConfirmReset(false);
  };

  // Substituição de imagem
  const handleReplaceImage = (e) => {
    const file = e.target.files[0];
    if (!file || !modalData) return;

    const { section, field } = modalData;
    setFormData((prev) => {
      const updated = { ...prev };
      if (field) updated[section][field] = file;
      else updated[section] = file;
      return updated;
    });

    setFeedback({ type: "success", text: "Imagem substituída com sucesso." });
    setModalData(null);
  };

  // Edição do número do documento via modal
  const handleEditDoc = () => setEditDocModal(true);
  const handleSaveDoc = () => {
    const newValue = formatDoc(docInputRef.current.value);
    if (!/^[0-9]{2}-[0-9]{6}$/.test(newValue)) {
      setFeedback({ type: "error", text: "Formato inválido. Use XX-XXXXXX." });
      return;
    }
    setDocumentNumber(newValue);
    setEditDocModal(false);
    setFeedback({ type: "success", text: "Número do documento atualizado com sucesso." });
  };

  // Upload final
  const handleConfirmUpload = async () => {
    if (!/^[0-9]{2}-[0-9]{6}$/.test(documentNumber)) {
      setFeedback({
        type: "error",
        text: "Formato inválido do número do documento. Use XX-XXXXXX.",
      });
      return;
    }

    try {
      setUploading(true);
      setFeedback({ type: "warning", text: "Enviando arquivos..." });

      const data = new FormData();
      data.append("documentNumber", documentNumber);
      if (formData.conferencia) data.append("conferencia", formData.conferencia);
      Object.entries(formData.carga || {}).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });
      if (formData.canhoto) data.append("canhoto", formData.canhoto);

      const res = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Falha no envio. Verifique os dados.");

      setToastVisible(true);
      setFeedback({ type: "success", text: "Upload concluído com sucesso!" });

      setTimeout(() => {
        setToastVisible(false);
        confirmResetProcess();
      }, 3000);
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Renderização dos previews
  const renderPreview = (file, label, section, field) => {
    if (!file) return null;
    let url = "";
    try {
      url = URL.createObjectURL(file);
    } catch {
      return null;
    }

    return (
      <div key={label} className="preview-card">
        <img
          src={url}
          alt={label}
          onClick={() => setModalData({ url, section, field })}
          loading="lazy"
        />
        <div className="preview-info">
          <span>{label}</span>
          <button
            className="edit-btn"
            onClick={() => setModalData({ url, section, field })}
            title={`Editar ${label}`}
          >
            <FaEdit />
          </button>
        </div>
      </div>
    );
  };

  // Etapa 4 — Revisão
  const renderSummary = () => (
    <div className="summary-container">
      <h1>Etapa 4 — Revisar e Confirmar Envio</h1>

      {/* 🔹 Número do Documento com botão de edição */}
      <div className="doc-edit">
        <div className="doc-edit-header">
          <label htmlFor="document-number">Número do Documento</label>
          <button
            className="edit-btn"
            onClick={handleEditDoc}
            title="Editar número do documento"
          >
            <FaEdit />
          </button>
        </div>

        <div className="doc-edit-value" id="document-number">
          {documentNumber || "—"}
        </div>
      </div>


      <div className="preview-grid">
        {renderPreview(formData.conferencia, "Conferência", "conferencia", null)}
        {renderPreview(formData.carga?.placa, "Placa", "carga", "placa")}
        {renderPreview(formData.carga?.carga1, "Carga 1", "carga", "carga1")}
        {renderPreview(formData.carga?.carga2, "Carga 2", "carga", "carga2")}
        {renderPreview(formData.canhoto, "Canhoto", "canhoto", null)}
      </div>

      <div className="button-row">
        <button className="secondary-btn" onClick={handleReset}>
          <FaRedoAlt /> Reiniciar Processo
        </button>
        <button
          className="primary-btn confirm-btn"
          onClick={handleConfirmUpload}
          disabled={uploading}
        >
          {uploading ? "Enviando..." : <>Confirmar Envio <FaCheckCircle /></>}
        </button>
      </div>

      {feedback && <p className={`feedback ${feedback.type}`}>{feedback.text}</p>}
    </div>
  );

  return (
    <div className="upload-page">
      <header className="header-container">
        <img src={Logo} alt="Logo ABR" id="logo" />
      </header>

      <main className="main-container">
        <div className="container">
          <StepHeader step={step} />

          {step === 1 && (
            <StepConferencia
              documentNumber={documentNumber}
              setDocumentNumber={setDocumentNumber}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
            <StepCarga
              documentNumber={documentNumber}
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onClear={handleClear}
            />
          )}
          {step === 3 && (
            <StepCanhoto
              documentNumber={documentNumber}
              setFormData={setFormData}
              onBack={handleBack}
              onNext={handleNext}
            />
          )}
          {step === 4 && renderSummary()}
        </div>
      </main>

      {/* Toast */}
      {toastVisible && (
        <div className="upload-toast">
          <FaCheckCircle className="icon" />
          <span>Upload enviado com sucesso!</span>
        </div>
      )}

      {/* 🔹 Modal de imagem */}
      {modalData && (
        <Modal
          modalData={modalData}
          fileInputRef={fileInputRef}
          onClose={() => setModalData(null)}
          onReplace={handleReplaceImage}
        />
      )}

      {/* 🔹 Modal de número do documento */}
      {editDocModal && (
        <Modal
          title="Editar Número do Documento"
          isDocEdit
          docInputRef={docInputRef}
          defaultValue={documentNumber}
          onClose={() => setEditDocModal(false)}
          onConfirm={handleSaveDoc}
        />
      )}

      {/* 🔹 Modal de confirmação de reset */}
      {confirmReset && (
        <Modal
          isConfirm
          title="Reiniciar Processo"
          message="Tem certeza que deseja reiniciar todo o processo?"
          onConfirm={confirmResetProcess}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
