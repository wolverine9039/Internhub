import React from 'react';
import { getInitials } from '@/utils/dateUtils';

interface UserRowProps {
  name: string;
  email: string;
  avatarGradient?: string;
  actionLabel: string;
  loadingLabel?: string;
  isActing: boolean;
  onAction: () => void;
  variant?: 'assigned' | 'available';
  buttonClass?: string;
  buttonStyle?: React.CSSProperties;
}

const UserRow: React.FC<UserRowProps> = ({
  name,
  email,
  avatarGradient,
  actionLabel,
  loadingLabel = '...',
  isActing,
  onAction,
  variant = 'assigned',
  buttonClass,
  buttonStyle,
}) => {
  const isAvailable = variant === 'available';
  const defaultBtnClass = isAvailable ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
  const defaultBtnStyle = isAvailable ? { fontSize: '11px' } : { color: 'var(--accent2)', fontSize: '11px' };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: isAvailable ? 'var(--surface)' : 'var(--surface2)',
      borderRadius: '6px',
      border: isAvailable ? '1px dashed var(--border)' : '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: avatarGradient || (isAvailable ? 'var(--surface2)' : 'linear-gradient(135deg, #f5c542, #e67e22)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: isAvailable ? 600 : 700,
          color: isAvailable ? 'var(--muted)' : '#fff',
        }}>
          {getInitials(name)}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: isAvailable ? 400 : 600, color: 'var(--text)' }}>{name}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{email}</div>
        </div>
      </div>
      <button
        className={buttonClass || defaultBtnClass}
        style={buttonStyle || defaultBtnStyle}
        onClick={onAction}
        disabled={isActing}
        type="button"
      >
        {isActing ? loadingLabel : actionLabel}
      </button>
    </div>
  );
};

export default UserRow;
