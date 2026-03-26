import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Shared/Sidebar';
import '@/pages/AdminPanel.css';

const TrainerPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeScreen, setActiveScreen] = useState('trainer-dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const renderScreen = () => {
        switch (activeScreen) {
            case 'trainer-dashboard':
                return (
                    <div className="fade-in">
                        <div className="page-header">
                            <div>
                                <div className="page-title">Trainer Dashboard <span className="wf-note">Coming Soon</span></div>
                                <div className="page-subtitle">Manage submissions and evaluate interns.</div>
                            </div>
                        </div>
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <div className="admin-card-title">Recent Submissions</div>
                            </div>
                            <div className="admin-card-body">
                                <div className="page-subtitle">Trainer module screens are under development.</div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
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
