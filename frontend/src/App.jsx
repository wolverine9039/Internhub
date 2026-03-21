import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPanel from './pages/loginpanel';
import AdminPanel from './pages/adminpanel';
import TrainerPanel from './pages/trainerpanel';
import InternPanel from './pages/internpanel';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LoginPanel />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/trainer" element={<TrainerPanel />} />
          <Route path="/intern" element={<InternPanel />} />
          <Route path="*" element={<div style={{ padding: '20px' }}>404 - Page Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
