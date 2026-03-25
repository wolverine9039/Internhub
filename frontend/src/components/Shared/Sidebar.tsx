import React from 'react';

interface SidebarProps {
  role: 'admin' | 'trainer' | 'intern';
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userName: string;
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeScreen,
  onNavigate,
  userName,
  userRole,
}) => {
  // Navigation items per role
  const navItems: Record<string, { label: string; icon: string; screen: string }[]> = {
    admin: [
      { label: 'Dashboard', icon: '⬛', screen: 'admin-dashboard' },
      { label: 'Users', icon: '👥', screen: 'admin-users' },
      { label: 'Cohorts', icon: '🗂', screen: 'admin-cohorts' },
      { label: 'Projects', icon: '📁', screen: 'admin-projects' },
      { label: 'Task Assignment', icon: '✅', screen: 'admin-tasks' },
      { label: 'Analytics', icon: '📊', screen: 'admin-analytics' },
    ],
    trainer: [
      { label: 'Dashboard', icon: '⬛', screen: 'trainer-dashboard' },
      { label: 'Submissions', icon: '📬', screen: 'trainer-submissions' },
      { label: 'Evaluation Form', icon: '⭐', screen: 'trainer-evaluation' },
    ],
    intern: [
      { label: 'Dashboard', icon: '⬛', screen: 'intern-dashboard' },
      { label: 'My Tasks', icon: '✅', screen: 'intern-tasks' },
      { label: 'Submit Work', icon: '📤', screen: 'intern-submission' },
      { label: 'My Progress', icon: '📈', screen: 'intern-progress' },
    ],
  };

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Intern<span>Hub</span>
      </div>

      <nav className="sidebar-nav">
        {navItems[role]?.map((item) => (
          <div
            key={item.screen}
            className={`nav-item ${activeScreen === item.screen ? 'active' : ''}`}
            onClick={() => onNavigate(item.screen)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
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
      </div>
    </aside>
  );
};

export default Sidebar;
