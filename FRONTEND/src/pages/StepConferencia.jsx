import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { FaArrowRight } from 'react-icons/fa';
import FileInput from '../components/FileInput';
import FeedbackMessage from '../components/FeedbackMessage';

export default function StepConferencia({ documentNumber, setDocumentNumber, setFormData, onNext }) {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatDoc = (v) => {
    let digits = v.replace(/\D/g, '');
    if (digits.length > 2) digits = digits.slice(0, 2) + '-' + digits.slice(2, 8);
    return digits;
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setLoading(true);
    setFeedback({ type: 'warning', text: 'Carregando imagem, aguarde...' });

    try {
      const compressed = await imageCompression(selected, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });

      setFile(compressed);
      setFeedback({ type: 'success', text: 'Foto da conferência carregada com sucesso.' });
    } catch {
      setFeedback({ type: 'error', text: 'Erro ao processar a imagem. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^[0-9]{2}-[0-9]{6}$/.test(documentNumber))
      return setFeedback({ type: 'warning', text: 'Formato inválido. Use XX-XXXXXX.' });
    if (!file)
      return setFeedback({ type: 'warning', text: 'Envie uma imagem antes de continuar.' });

    setFormData((prev) => ({ ...prev, conferencia: file }));
    onNext();
  };

  return (
    <>
      <h1>Etapa 1 — Conferência</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="document">Número do Documento:</label>
        <input
          id="document"
          type="text"
          placeholder="Ex: 04-021832"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(formatDoc(e.target.value))}
          required
        />

        <FileInput
          label="Foto da Conferência"
          fileType="foto"
          onChange={handleFileChange}
          onClear={() => {
            setFile(null);
            setFeedback({ type: 'success', text: 'Arquivo removido com sucesso.' });
          }}
        />

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Carregando...' : <>Próxima Etapa <FaArrowRight /></>}
        </button>

        {feedback && <FeedbackMessage type={feedback.type} text={feedback.text} />}
      </form>
    </>
  );
}
