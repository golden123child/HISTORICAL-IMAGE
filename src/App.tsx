import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import SurveyPage from './pages/SurveyPage';
import ManagePage from './pages/ManagePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/manage" replace />} />
        <Route path="/survey/:token" element={<SurveyPage />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="*" element={<Navigate to="/manage" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
