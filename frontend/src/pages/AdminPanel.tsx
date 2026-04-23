import React, { useState } from 'react';
import DashboardLayout from '@/components/Shared/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import AdminUsers from '@/components/Admin/AdminUsers';
import AdminCohorts from '@/components/Admin/AdminCohorts';
import AdminProjects from '@/components/Admin/AdminProjects';
import AdminTasks from '@/components/Admin/AdminTasks';
import AdminSubmissions from '@/components/Admin/AdminSubmissions';
import AdminEvaluations from '@/components/Admin/AdminEvaluations';
import AdminAnalytics from '@/components/Admin/AdminAnalytics';
import SettingsPanel from '@/components/Shared/SettingsPanel';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeScreen, setActiveScreen] = useState('admin-dashboard');

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
            case 'admin-analytics':
                return <AdminAnalytics onNavigate={setActiveScreen} />;
            case 'settings':
                return <SettingsPanel />;
            default:
                return <AdminDashboard onNavigate={setActiveScreen} />;
        }
    };

    return (
        <DashboardLayout
            role="admin"
            activeScreen={activeScreen}
            onNavigate={setActiveScreen}
            userName={user?.name || 'Administrator'}
            userRole="Admin"
        >
            {renderScreen()}
        </DashboardLayout>
    );
};

export default AdminPanel;
