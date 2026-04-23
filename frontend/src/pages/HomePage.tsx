import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import './HomePage.css';

interface RoleCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const roles: RoleCard[] = [
    {
      id: 'intern',
      title: 'Intern Login',
      description: 'Access your tasks and track your progress.',
      icon: '👨‍💼',
      color: '#6366f1',
    },
    {
      id: 'trainer',
      title: 'Trainer Login',
      description: 'Review submissions and manage interns.',
      icon: '👨‍🏫',
      color: '#8b5cf6',
    },
    {
      id: 'admin',
      title: 'Admin Login',
      description: 'Manage system users and projects.',
      icon: '👨‍💻',
      color: '#ec4899',
    },
  ];

  const handleCardClick = (roleId: string) => {
    navigate(`/login?role=${roleId}`);
  };

  return (
    <div className="home-container">
      {/* Theme Toggle Switch */}
      <div className="theme-toggle">
        <span className="toggle-icon">🌙</span>
        <label className="switch" aria-label="Toggle theme">
          <input
            type="checkbox"
            checked={!isDark}
            onChange={toggleTheme}
          />
          <span className="slider"></span>
        </label>
        <span className="toggle-icon">☀️</span>
      </div>

      <div className="home-content">
        <div className="logo-section">
          <h1 className="logo-text">
            <span className="logo-intern">Intern</span>
            <span className="logo-hub"> Management Tool</span>
          </h1>
          <p className="tagline">Learning Management System</p>
        </div>

        <div className="cards-container">
          {roles.map((role) => (
            <div
              key={role.id}
              className="role-card"
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(role.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(role.id); } }}
              style={{ borderTopColor: role.color }}
            >
              <div className="card-icon">{role.icon}</div>
              <h3 className="card-title">{role.title}</h3>
              <p className="card-description">{role.description}</p>
              <button className="card-button" style={{ backgroundColor: role.color }}>
                Login Now
              </button>
            </div>
          ))}
        </div>

        <footer className="home-footer">
          <p>© 2026 Intern Management Tool. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
