import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { getErrorMessage } from '@/utils/errorUtils';
import './SettingsPanel.css';

const getStrengthInfo = (password: string) => {
  if (password.length >= 12) return { barClass: 'strong', label: 'Strong' };
  if (password.length >= 8) return { barClass: 'medium', label: 'Medium' };
  if (password.length >= 6) return { barClass: 'weak', label: 'Weak' };
  return { barClass: 'too-short', label: 'Too short' };
};

const AppearanceSection: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <span className="settings-icon">🎨</span>
        <div>
          <h3 className="settings-card-title">Appearance</h3>
          <p className="settings-card-desc">Customize how InternHub looks for you</p>
        </div>
      </div>
      <div className="settings-card-body">
        <div className="settings-row">
          <div className="settings-row-info">
            <strong>Theme</strong>
            <span className="settings-muted">Switch between light and dark mode</span>
          </div>
          <div className="theme-switcher">
            <button
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => theme !== 'light' && toggleTheme()}
              title="Light Mode"
            >
              <span className="theme-option-icon">☀️</span>
              <span className="theme-option-label">Light</span>
            </button>
            <button
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => theme !== 'dark' && toggleTheme()}
              title="Dark Mode"
            >
              <span className="theme-option-icon">🌙</span>
              <span className="theme-option-label">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountSecuritySection: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: 'All fields are required', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage({ text: data.message || 'Password changed successfully', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, 'Failed to change password'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <span className="settings-icon">🔐</span>
        <div>
          <h3 className="settings-card-title">Account Security</h3>
          <p className="settings-card-desc">Manage your password and account security</p>
        </div>
      </div>
      <div className="settings-card-body">
        {/* Current user info */}
        <div className="settings-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div className="settings-row-info">
            <strong>Signed in as</strong>
            <span className="settings-muted">{user?.email}</span>
          </div>
          <div className="settings-badge">{user?.role}</div>
        </div>

        <h4 className="settings-section-title">Change Password</h4>

        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="settings-form">
          <div className="settings-form-group">
            <label htmlFor="current-password">Current Password</label>
            <div className="settings-password-wrapper">
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button type="button" className="settings-pw-toggle" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="settings-form-row">
            <div className="settings-form-group">
              <label htmlFor="new-password">New Password</label>
              <div className="settings-password-wrapper">
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                />
                <button type="button" className="settings-pw-toggle" onClick={() => setShowNew(!showNew)}>
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="settings-form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Password strength hint */}
          {newPassword && (
            <div className="password-strength">
              <div className={`strength-bar ${getStrengthInfo(newPassword).barClass}`} />
              <span className="strength-label">
                {getStrengthInfo(newPassword).label}
              </span>
            </div>
          )}

          <div className="settings-form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsPanel: React.FC = () => {
  return (
    <div className="view-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your preferences and account security</p>
        </div>
      </div>

      <AppearanceSection />
      <AccountSecuritySection />
    </div>
  );
};

export default SettingsPanel;
