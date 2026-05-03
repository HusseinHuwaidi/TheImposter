import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'

// Inject Google AdSense script dynamically if configured
const adSensePubId = import.meta.env.VITE_ADSENSE_PUB_ID;
if (adSensePubId) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSensePubId}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
