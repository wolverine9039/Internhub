import React, { useState } from 'react';
import Sidebar from '@/components/Shared/Sidebar';

interface DashboardLayoutProps {
  role: 'admin' | 'trainer' | 'intern';
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  activeScreen,
  onNavigate,
  userName,
  userRole,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app fade-in">
      <Sidebar
        role={role}
        activeScreen={activeScreen}
        onNavigate={(screen) => { setSidebarOpen(false); onNavigate(screen); }}
        userName={userName}
        userRole={userRole}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Mobile header */}
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="mobile-brand">Intern<span> Management Tool</span></div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
