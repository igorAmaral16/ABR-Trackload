import { Routes, Route } from 'react-router-dom';
import UploadFlow from './pages/UploadFlow';
import Dashboard from './pages/Dashboard';
import ConsultaPage from './pages/ConsultaPage';

export default function App() {
  return (
    <Routes>
      <Route path="/upload" element={<UploadFlow />} />
      <Route path="/consulta" element={<ConsultaPage />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}
