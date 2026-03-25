import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  color = 'blue',
}) => {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta && <div className="stat-delta">{delta}</div>}
    </div>
  );
};

export default StatCard;
