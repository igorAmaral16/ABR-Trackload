import { FaFileUpload } from 'react-icons/fa';

export default function StepHeader({ step }) {
  const steps = ['Conferência', 'Carga', 'Canhoto', 'Confirmação'];
  const progress = (step / 4) * 100;

  return (
    <div className="step-header">
      <div className="step-title">
        <FaFileUpload /> Etapa {step} de 4 — {steps[step - 1]}
      </div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
