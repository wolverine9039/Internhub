import React, { useState } from 'react';
import Sidebar from '@/components/Shared/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { TrainerDashboard, TrainerEvaluationForm, TrainerSubmissions } from '@/components/Trainer';
import type { Submission } from '@/types';
import './TrainerPanel.css';

const sampleSubmissions: Submission[] = [
  {
    id: 1,
    task_id: 1,
    intern_id: 11,
    attempt_no: 1,
    github_url: 'https://github.com/arjun/internhub-auth',
    demo_url: undefined,
    file_url: undefined,
    notes: 'Includes JWT authentication with role-based middleware.',
    status: 'submitted',
    submitted_at: '2025-06-17T09:42:00Z',
    reviewed_at: undefined,
    updated_at: '2025-06-17T09:42:00Z',
    task_title: 'Build Login API',
    intern_name: 'Arjun Kumar',
  },
  {
    id: 2,
    task_id: 2,
    intern_id: 12,
    attempt_no: 1,
    github_url: 'https://drive.google.com/schema-diagram',
    demo_url: undefined,
    file_url: undefined,
    notes: 'ER diagram and SQL schema file. Includes 6 tables with constraints.',
    status: 'submitted',
    submitted_at: '2025-06-16T15:10:00Z',
    reviewed_at: undefined,
    updated_at: '2025-06-16T15:10:00Z',
    task_title: 'Database Schema Design',
    intern_name: 'Sneha Verma',
  },
  {
    id: 3,
    task_id: 3,
    intern_id: 13,
    attempt_no: 1,
    github_url: 'https://github.com/mihir/react-dashboard',
    demo_url: undefined,
    file_url: undefined,
    notes: 'Evaluation complete. Feedback provided on component structure.',
    status: 'reviewed',
    submitted_at: '2025-06-15T11:00:00Z',
    reviewed_at: '2025-06-16T09:00:00Z',
    updated_at: '2025-06-16T09:00:00Z',
    task_title: 'React Dashboard UI',
    intern_name: 'Mihir Rao',
  },
];

const TrainerPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState('trainer-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | undefined>(sampleSubmissions[0]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'trainer-dashboard':
        return (
          <TrainerDashboard
            onNavigate={setActiveScreen}
            onSelectSubmission={(submissionId) => {
              const submission = sampleSubmissions.find((item) => item.id === submissionId);
              if (submission) {
                setSelectedSubmission(submission);
                setActiveScreen('trainer-evaluation');
              }
            }}
          />
        );
      case 'trainer-submissions':
        return (
          <TrainerSubmissions
            onNavigate={setActiveScreen}
            onSelectSubmission={(submission) => {
              setSelectedSubmission(submission);
              setActiveScreen('trainer-evaluation');
            }}
          />
        );
      case 'trainer-evaluation':
        return <TrainerEvaluationForm selectedSubmission={selectedSubmission} onBack={() => setActiveScreen('trainer-submissions')} />;
      default:
        return (
          <TrainerDashboard
            onNavigate={setActiveScreen}
            onSelectSubmission={(submissionId) => {
              const submission = sampleSubmissions.find((item) => item.id === submissionId);
              if (submission) {
                setSelectedSubmission(submission);
                setActiveScreen('trainer-evaluation');
              }
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
      />
      <main className="main">
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="mobile-brand">
            Intern<span>Hub</span>
          </div>
        </div>
        {renderScreen()}
      </main>
    </div>
  );
};

export default TrainerPanel;
