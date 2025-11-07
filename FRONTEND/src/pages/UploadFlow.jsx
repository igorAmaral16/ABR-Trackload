import { useEffect, useState } from 'react';
import StepConferencia from './StepConferencia';
import StepCarga from './StepCarga';
import StepCanhoto from './StepCanhoto';
import StepHeader from '../components/StepHeader';
import Logo from '../assets/LogoAbr.png';
import '../styles/UploadPage.css';

export default function UploadFlow() {
  const [step, setStep] = useState(() => Number(localStorage.getItem('step')) || 1);
  const [documentNumber, setDocumentNumber] = useState(localStorage.getItem('documentNumber') || '');
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('formData');
    return saved ? JSON.parse(saved) : { conferencia: null, carga: {}, canhoto: null };
  });

  useEffect(() => {
    localStorage.setItem('step', step);
    localStorage.setItem('documentNumber', documentNumber);
    localStorage.setItem('formData', JSON.stringify(formData));
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
              onFinish={() => {
                localStorage.clear();
                alert('Upload finalizado com sucesso!');
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
