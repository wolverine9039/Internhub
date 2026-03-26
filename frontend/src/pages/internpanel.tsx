import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Shared/Sidebar';
import { InternDashboard, InternTasks, InternSubmit, InternProgress } from '@/components/Intern';
import '@/pages/AdminPanel.css';

const InternPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeScreen, setActiveScreen] = useState('intern-dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
            default:
                return <InternDashboard user={user} onNavigate={setActiveScreen} />;
        }
    };

    return (
        <div className="app fade-in">
            <Sidebar
                role="intern"
                activeScreen={activeScreen}
                onNavigate={setActiveScreen}
                userName={user?.name || 'Intern'}
                userRole="Intern"
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
            <main className="main">{renderScreen()}</main>
        </div>
    );
};

export default InternPanel;
