import React from 'react';

interface BadgeProps {
  variant?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'gray', children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};

export default Badge;
