import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import LoginPanel from '@/pages/LoginPanel';
import AdminPanel from '@/pages/AdminPanel';
import TrainerPanel from '@/pages/TrainerPanel';
import InternPanel from '@/pages/InternPanel';
import NotFound from '@/pages/NotFound';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPanel />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/trainer" element={<TrainerPanel />} />
      <Route path="/intern" element={<InternPanel />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
