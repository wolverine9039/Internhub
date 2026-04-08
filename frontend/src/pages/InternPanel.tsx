import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/Shared/DashboardLayout';
import { InternDashboard, InternTasks, InternSubmit, InternProgress } from '@/components/Intern';
import SettingsPanel from '@/components/Shared/SettingsPanel';
import '@/pages/AdminPanel.css';

const InternPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeScreen, setActiveScreen] = useState('intern-dashboard');

    const renderScreen = () => {
        switch (activeScreen) {
            case 'intern-dashboard':
                return <InternDashboard user={user} onNavigate={setActiveScreen} />;
            case 'intern-tasks':
                return <InternTasks user={user} />;
            case 'intern-submission':
                return <InternSubmit user={user} onNavigate={setActiveScreen} />;
            case 'intern-progress':
                return <InternProgress user={user} />;
            case 'settings':
                return <SettingsPanel />;
            default:
                return <InternDashboard user={user} onNavigate={setActiveScreen} />;
        }
    };

    return (
        <DashboardLayout
            role="intern"
            activeScreen={activeScreen}
            onNavigate={setActiveScreen}
            userName={user?.name || 'Intern'}
            userRole="Intern"
        >
            {renderScreen()}
        </DashboardLayout>
    );
};

export default InternPanel;
