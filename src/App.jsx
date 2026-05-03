import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HostView from './views/HostView';
import ClientView from './views/ClientView';
import './App.css';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // 1. IP Geolocation for automatic language detection
    // Only run if the user hasn't explicitly set a language in localStorage
    const hasUserSelectedLanguage = localStorage.getItem('i18nextLng');
    
    if (!hasUserSelectedLanguage) {
      fetch('https://get.geojs.io/v1/ip/country.json')
        .then(res => res.json())
        .then(data => {
          // List of Arab League ISO 2-letter country codes
          const arabCountries = ['SA', 'AE', 'EG', 'QA', 'KW', 'BH', 'OM', 'IQ', 'JO', 'LB', 'SY', 'PS', 'YE', 'SD', 'LY', 'TN', 'DZ', 'MA', 'MR', 'SO', 'DJ', 'KM'];
          
          if (data && data.country && arabCountries.includes(data.country)) {
            i18n.changeLanguage('ar');
          }
        })
        .catch(err => console.warn('Failed to detect location by IP', err));
    }
  }, [i18n]);

  useEffect(() => {
    // 2. RTL direction synchronization
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
