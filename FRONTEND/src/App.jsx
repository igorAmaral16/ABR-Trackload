import { Routes, Route } from 'react-router-dom';
import UploadFlow from './pages/UploadFlow';
import Dashboard from './pages/Dashboard';
import ConsultaPage from './pages/ConsultaPage';
import StepCanhoto from './pages/StepCanhoto';
import StepCarga from './pages/StepCarga';
import StepConferencia from './pages/StepConferencia';

export default function App() {
  return (
    <Routes>
      <Route path="/upload/conferencia" element={<StepConferencia />} />
      <Route path="/upload/carga" element={<StepCarga />} />
      <Route path="/upload/canhoto" element={<StepCanhoto />} />
      <Route path="/upload" element={<UploadFlow />} />
      <Route path="/consulta" element={<ConsultaPage />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}
