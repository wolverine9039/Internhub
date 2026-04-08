import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  role: 'admin' | 'trainer' | 'intern';
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userName: string;
  userRole: string;
  isOpen?: boolean;
  onToggle?: () => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeScreen,
  onNavigate,
  userName,
  userRole,
  isOpen = true,
  onToggle,
  collapsed = false,
  onCollapseToggle,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems: Record<string, { label: string; icon: string; screen: string }[]> = {
    admin: [
      { label: 'Dashboard', icon: '🏛️', screen: 'admin-dashboard' },
      { label: 'Users', icon: '👥', screen: 'admin-users' },
      { label: 'Cohorts', icon: '🗂', screen: 'admin-cohorts' },
      { label: 'Projects', icon: '📁', screen: 'admin-projects' },
      { label: 'Task Assignment', icon: '✅', screen: 'admin-tasks' },
      { label: 'Submissions', icon: '📬', screen: 'admin-submissions' },
      { label: 'Evaluations', icon: '⭐', screen: 'admin-evaluations' },
      { label: 'Analytics', icon: '📊', screen: 'admin-analytics' },
      { label: 'Settings', icon: '⚙️', screen: 'settings' },
    ],
    trainer: [
      { label: 'Dashboard', icon: '🏛️', screen: 'trainer-dashboard' },
      { label: 'My Interns', icon: '👥', screen: 'trainer-interns' },
      { label: 'Submissions', icon: '📬', screen: 'trainer-submissions' },
      { label: 'Evaluate', icon: '⭐', screen: 'trainer-evaluation' },
      { label: 'My Evaluations', icon: '📋', screen: 'trainer-evaluations' },
      { label: 'Settings', icon: '⚙️', screen: 'settings' },
    ],
    intern: [
      { label: 'Dashboard', icon: '🏛️', screen: 'intern-dashboard' },
      { label: 'My Tasks', icon: '✅', screen: 'intern-tasks' },
      { label: 'Submit Work', icon: '📤', screen: 'intern-submission' },
      { label: 'My Progress', icon: '📈', screen: 'intern-progress' },
      { label: 'Settings', icon: '⚙️', screen: 'settings' },
    ],
  };

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleNavClick = (screen: string) => {
    onNavigate(screen);
    // Close sidebar on mobile after navigation
    if (onToggle && window.innerWidth <= 768) {
      onToggle();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onToggle} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo & collapse toggle */}

        <div className="sidebar-top">
          <div className="sidebar-logo">
            Intern<span>Hub</span>
          </div>
          <button
            className="collapse-btn"
            onClick={onCollapseToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className={`collapse-icon ${collapsed ? 'rotated' : ''}`}>«</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems[role]?.map((item) => (
            <div
              key={item.screen}
              className={`nav-item ${activeScreen === item.screen ? 'active' : ''}`}
              onClick={() => handleNavClick(item.screen)}
              title={collapsed ? item.label : undefined}
            >
              <span className="icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-role">{userRole}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            <span className="logout-icon">⏻</span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
