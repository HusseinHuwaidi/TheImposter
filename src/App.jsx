import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HostView from './views/HostView';
import ClientView from './views/ClientView';
import './App.css';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language?.split('-')[0] || 'en';
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    
    if (rtlLanguages.includes(lang)) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [i18n.language]);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/play" replace />} />
          <Route path="/host" element={<HostView />} />
          <Route path="/play" element={<ClientView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
