import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Shared/Sidebar';
import { InternDashboard, InternTasks, InternSubmit, InternProgress } from '@/components/Intern';
import SettingsPanel from '@/components/Shared/SettingsPanel';
import '@/pages/AdminPanel.css';

const InternPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeScreen, setActiveScreen] = useState('intern-dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        <div className="app fade-in">
            <Sidebar
                role="intern"
                activeScreen={activeScreen}
                onNavigate={setActiveScreen}
                userName={user?.name || 'Intern'}
                userRole="Intern"
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

export default InternPanel;
