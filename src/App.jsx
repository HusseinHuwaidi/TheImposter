import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HostView from './views/HostView';
import ClientView from './views/ClientView';
import './App.css';

function App() {
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
