import React, { useState } from 'react';
import Sidebar from '@/components/Shared/Sidebar';
import { useAuth } from '@/context/AuthContext';
import {
  TrainerDashboard,
  TrainerInterns,
  TrainerSubmissions,
  TrainerEvaluationForm,
  TrainerMyEvaluations,
} from '@/components/Trainer';
import SettingsPanel from '@/components/Shared/SettingsPanel';
import type { Submission } from '@/types';
import './TrainerPanel.css';

const TrainerPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState('trainer-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | undefined>(undefined);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'trainer-dashboard':
        return (
          <TrainerDashboard
            onNavigate={setActiveScreen}
            onSelectSubmission={(submission) => {
              setSelectedSubmission(submission);
              setActiveScreen('trainer-evaluation');
            }}
          />
        );
      case 'trainer-interns':
        return <TrainerInterns onNavigate={setActiveScreen} />;
      case 'trainer-submissions':
        return (
          <TrainerSubmissions
            onNavigate={setActiveScreen}
            onSelectSubmission={(submission) => {
              setSelectedSubmission(submission);
            }}
          />
        );
      case 'trainer-evaluation':
        return (
          <TrainerEvaluationForm
            selectedSubmission={selectedSubmission}
            onBack={() => setActiveScreen('trainer-submissions')}
            onSubmitted={() => setSelectedSubmission(undefined)}
          />
        );
      case 'trainer-evaluations':
        return <TrainerMyEvaluations onNavigate={setActiveScreen} />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return (
          <TrainerDashboard
            onNavigate={setActiveScreen}
            onSelectSubmission={(submission) => {
              setSelectedSubmission(submission);
              setActiveScreen('trainer-evaluation');
            }}
          />
        );
    }
  };

  return (
    <div className="app fade-in">
      <Sidebar
        role="trainer"
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        userName={user?.name || 'Trainer'}
        userRole="Trainer"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Mobile header */}
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="mobile-brand">Intern<span>Hub</span></div>
        </div>
        {renderScreen()}
      </main>
    </div>
  );
};

export default TrainerPanel;
