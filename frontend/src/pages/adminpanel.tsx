import React, { useState } from 'react';
import Sidebar from '@/components/Shared/Sidebar';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import AdminUsers from '@/components/Admin/AdminUsers';
import AdminCohorts from '@/components/Admin/AdminCohorts';
import AdminProjects from '@/components/Admin/AdminProjects';
import AdminTasks from '@/components/Admin/AdminTasks';
import AdminSubmissions from '@/components/Admin/AdminSubmissions';
import AdminEvaluations from '@/components/Admin/AdminEvaluations';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeScreen, setActiveScreen] = useState('admin-dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const renderScreen = () => {
        switch (activeScreen) {
            case 'admin-dashboard':
                return <AdminDashboard onNavigate={setActiveScreen} />;
            case 'admin-users':
                return <AdminUsers onNavigate={setActiveScreen} />;
            case 'admin-cohorts':
                return <AdminCohorts onNavigate={setActiveScreen} />;
            case 'admin-projects':
                return <AdminProjects onNavigate={setActiveScreen} />;
            case 'admin-tasks':
                return <AdminTasks onNavigate={setActiveScreen} />;
            case 'admin-submissions':
                return <AdminSubmissions onNavigate={setActiveScreen} />;
            case 'admin-evaluations':
                return <AdminEvaluations onNavigate={setActiveScreen} />;
            default:
                return <AdminDashboard onNavigate={setActiveScreen} />;
        }
    };

    return (
        <div className="app fade-in">
            <Sidebar 
                role="admin" 
                activeScreen={activeScreen} 
                onNavigate={setActiveScreen} 
                userName={user?.name || 'Administrator'} 
                userRole="Admin" 
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
            <main className="main">
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

export default AdminPanel;
