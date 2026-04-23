import React, { useState } from 'react';
import DashboardLayout from '@/components/Shared/DashboardLayout';
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
        setActiveScreen('trainer-dashboard');
        return null;
    }
  };

  return (
    <DashboardLayout
      role="trainer"
      activeScreen={activeScreen}
      onNavigate={setActiveScreen}
      userName={user?.name || 'Trainer'}
      userRole="Trainer"
    >
      {renderScreen()}
    </DashboardLayout>
  );
};

export default TrainerPanel;
