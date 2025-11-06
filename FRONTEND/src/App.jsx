import { Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage.jsx';
import ConsultaPage from './pages/ConsultaPage.jsx';
import HomePage from './pages/HomePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/consulta" element={<ConsultaPage />} />
      <Route path="/home" element={<HomePage />} />
    </Routes>
  );
}
