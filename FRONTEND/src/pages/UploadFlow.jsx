import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { get, set, clear } from "idb-keyval";
import StepConferencia from "./StepConferencia";
import StepCarga from "./StepCarga";
import StepCanhoto from "./StepCanhoto";
import Modal from "../components/Modal";
import ModalConfirmacao from "../components/ModalConfirmacao";
import Header from "../components/Header";
import "../styles/UploadPage.css";
import { FaCheckCircle, FaRedoAlt, FaEdit, FaTimes } from "react-icons/fa";

export default function UploadFlow() {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [documentNumber, setDocumentNumber] = useState("");
  const [formData, setFormData] = useState({
    conferencia: null,
    carga: {},
    canhoto: null,
  });

  const [modalData, setModalData] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editDocModal, setEditDocModal] = useState(false);

  const [feedback, setFeedback] = useState(null);

  // Modal 1: confirmar envio?
  const [showConfirmEnvioModal, setShowConfirmEnvioModal] = useState(false);

  // Modal 2: envio preparado (com toast de desfazer)
  const [showEnvioPreparadoModal, setShowEnvioPreparadoModal] = useState(false);

  // Toast verde com opção de desfazer
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Envio real (chamada ao backend) em andamento
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const navigate = useNavigate();

  // 🔹 Restaurar dados do IndexedDB
  useEffect(() => {
    const hydrate = async () => {
      try {
        const savedStep = await get("step");
        const savedDoc = await get("documentNumber");
        const savedForm = await get("formData");
        if (savedStep) setStep(savedStep);
        if (savedDoc) setDocumentNumber(savedDoc);
        if (savedForm) setFormData(savedForm);
      } catch (err) {
        console.error("Erro ao restaurar dados:", err);
      } finally {
        setHydrated(true);
      }
    };
    hydrate();
  }, []);

  // 🔹 Salvar no IndexedDB ao alterar algo
  useEffect(() => {
    if (!hydrated) return;
    set("step", step);
    set("documentNumber", documentNumber);
    set("formData", formData);
  }, [step, documentNumber, formData, hydrated]);

  const formatDoc = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 2)
      digits = digits.slice(0, 2) + "-" + digits.slice(2, 8);
    return digits;
  };

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

  const handleReset = () => setConfirmReset(true);

  const confirmResetProcess = async () => {
    await clear();
    setFormData({ conferencia: null, carga: {}, canhoto: null });
    setDocumentNumber("");
    setStep(1);
    setFeedback(null);
    setConfirmReset(false);
  };

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
    setFeedback({ type: "success", text: "Imagem substituída." });
    setModalData(null);
  };

  const handleEditDoc = () => setEditDocModal(true);

  const handleSaveDoc = () => {
    const newValue = formatDoc(docInputRef.current.value);
    if (!/^[0-9]{2}-[0-9]{6}$/.test(newValue)) {
      setFeedback({
        type: "error",
        text: "Formato inválido. Use XX-XXXXXX.",
      });
      return;
    }
    setDocumentNumber(newValue);
    setEditDocModal(false);
    setFeedback({ type: "success", text: "Número atualizado." });
  };

  // 🔹 Abrir modal de confirmação antes do envio
  const handleOpenConfirmEnvioModal = () => {
    if (!/^[0-9]{2}-[0-9]{6}$/.test(documentNumber)) {
      setFeedback({
        type: "error",
        text: "Formato inválido. Use XX-XXXXXX.",
      });
      return;
    }
    setShowConfirmEnvioModal(true);
  };

  // 🔹 Usuário clicou em "Continuar" no primeiro modal
  const handleConfirmEnvioContinua = () => {
    setShowConfirmEnvioModal(false);
    // Aqui NÃO envia ainda.
    setShowEnvioPreparadoModal(true);
    setShowUndoToast(true);
    setFeedback(null);
  };

  // 🔹 Usuário clicou em "Cancelar" no primeiro modal
  const handleConfirmEnvioCancela = () => {
    setShowConfirmEnvioModal(false);
  };

  // 🔹 Desfazer no toast → cancela tudo antes de enviar
  const handleUndoUpload = () => {
    if (isSubmittingUpload) return;
    setShowUndoToast(false);
    setShowEnvioPreparadoModal(false);
    setFeedback({
      type: "warning",
      text: "Envio cancelado. Revise as informações e tente novamente se necessário.",
    });
  };

  // 🔹 Envio real para o backend (chamado só quando o usuário “confirma de verdade”)
  const commitUpload = async (action) => {
    if (isSubmittingUpload) return;

    setIsSubmittingUpload(true);
    setShowUndoToast(false); // não faz mais sentido desfazer depois daqui

    try {
      // validação extra por segurança
      if (!/^[0-9]{2}-[0-9]{6}$/.test(documentNumber)) {
        setFeedback({
          type: "error",
          text: "Formato inválido. Use XX-XXXXXX.",
        });
        setIsSubmittingUpload(false);
        setShowEnvioPreparadoModal(false);
        return;
      }

      const data = new FormData();
      data.append("documentNumber", documentNumber);

      if (formData.conferencia)
        data.append("conferencia", formData.conferencia);

      Object.entries(formData.carga || {}).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      if (formData.canhoto) data.append("canhoto", formData.canhoto);

      const res = await fetch(
        import.meta.env.VITE_BACKEND_URL + "/upload",
        {
          method: "POST",
          body: data,
        }
      );

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.message || "Falha no upload.");

      // Sucesso: limpa tudo e redireciona
      await confirmResetProcess();
      setShowEnvioPreparadoModal(false);
      setIsSubmittingUpload(false);

      if (action === "consultar") {
        navigate("/consulta");
      } else {
        // fechar modal, fechar toast, redirecionar para "/"
        navigate("/");
      }
    } catch (err) {
      const msg = err.message.includes("Failed to fetch")
        ? "Erro de conexão com o servidor."
        : err.message;
      setFeedback({ type: "error", text: msg });
      setIsSubmittingUpload(false);
      setShowEnvioPreparadoModal(false);
    }
  };

  // 🔹 Ações que disparam o commit
  const handleEnvioCloseModal = () => commitUpload("close");
  const handleEnvioToastClose = () => commitUpload("close");
  const handleConsultarDocumentos = () => commitUpload("consultar");
  const handleNovaCarga = () => commitUpload("nova");

  const renderPreview = (file, label, section, field) => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    return (
      <div key={label} className="preview-card">
        <img
          src={url}
          alt={label}
          onClick={() => setModalData({ url, section, field })}
        />
        <div className="preview-info">
          <span>{label}</span>
          <button
            className="edit-btn"
            onClick={() => setModalData({ url, section, field })}
          >
            <FaEdit />
          </button>
        </div>
      </div>
    );
  };

  const renderSummary = () => (
    <div className="summary-container">
      <h1>Etapa 4 — Revisar e Confirmar Envio</h1>

      <div className="doc-edit">
        <label
          htmlFor="document-number-view"
          className="doc-edit-label"
        >
          Número do Documento
        </label>

        <div className="doc-edit-row">
          <div
            id="document-number-view"
            className="doc-edit-value"
          >
            {documentNumber || "—"}
          </div>

          <button
            type="button"
            className="edit-btn doc-edit-btn"
            onClick={handleEditDoc}
          >
            <FaEdit />
          </button>
        </div>
      </div>

      <div className="preview-grid">
        {renderPreview(
          formData.conferencia,
          "Conferência",
          "conferencia",
          null
        )}
        {renderPreview(formData.carga?.placa, "Placa", "carga", "placa")}
        {renderPreview(formData.carga?.carga1, "Carga 1", "carga", "carga1")}
        {renderPreview(formData.carga?.carga2, "Carga 2", "carga", "carga2")}
        {renderPreview(formData.canhoto, "Canhoto", "canhoto", null)}
      </div>

      <div className="button-row">
        <button className="secondary-btn" onClick={handleReset}>
          <FaRedoAlt /> Reiniciar
        </button>
        <button
          className="primary-btn confirm-btn"
          type="button"
          onClick={handleOpenConfirmEnvioModal}
          disabled={isSubmittingUpload}
        >
          {isSubmittingUpload ? (
            "Enviando..."
          ) : (
            <>
              Confirmar Envio <FaCheckCircle />
            </>
          )}
        </button>
      </div>

      {feedback && (
        <p className={`feedback ${feedback.type}`}>{feedback.text}</p>
      )}
    </div>
  );

  if (!hydrated)
    return <p style={{ textAlign: "center" }}>Carregando dados salvos...</p>;

  return (
    <div className="upload-page">
      <Header />
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

      {/* Toast verde com opção de desfazer */}
      {showUndoToast && (
        <div className="upload-toast undo-toast">
          <FaCheckCircle className="icon" />
          <span>Envio preparado. Você pode desfazer antes de concluir.</span>
          <button
            type="button"
            className="toast-action"
            onClick={handleUndoUpload}
          >
            Desfazer
          </button>
          <button
            type="button"
            className="toast-close"
            onClick={handleEnvioToastClose}
            aria-label="Concluir envio"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Modal de visualização/edição de imagem */}
      {modalData && (
        <Modal
          modalData={modalData}
          fileInputRef={fileInputRef}
          onClose={() => setModalData(null)}
          onReplace={handleReplaceImage}
        />
      )}

      {/* Modal para editar número do documento */}
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

      {/* Modal de confirmação de reset geral */}
      {confirmReset && (
        <Modal
          isConfirm
          title="Reiniciar Processo"
          message="Tem certeza que deseja reiniciar todo o processo?"
          onConfirm={confirmResetProcess}
          onClose={() => setConfirmReset(false)}
        />
      )}

      {/* Modal 1: Confirmar envio? */}
      {showConfirmEnvioModal && (
        <Modal
          isConfirm
          title="Confirmar Envio"
          message="Deseja continuar com o envio deste documento e das imagens?"
          onConfirm={handleConfirmEnvioContinua}
          onClose={handleConfirmEnvioCancela}
        />
      )}

      {/* Modal 2: Envio preparado (com opções) */}
      <ModalConfirmacao
        isOpen={showEnvioPreparadoModal}
        documentNumber={documentNumber}
        isSubmitting={isSubmittingUpload}
        onClose={handleEnvioCloseModal}
        onConsultar={handleConsultarDocumentos}
        onNovaCarga={handleNovaCarga}
      />
    </div>
  );
}
