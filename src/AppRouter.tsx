import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainApp from './App';
import NotesPage from './pages/NotesPage';
import GoogleCallback from './pages/GoogleCallback';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/auth/callback" element={<GoogleCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
