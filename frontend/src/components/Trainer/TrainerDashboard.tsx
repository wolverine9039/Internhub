import React from 'react';
import Badge from '@/components/Shared/Badge';

interface TrainerDashboardProps {
  onNavigate: (screen: string) => void;
  onSelectSubmission: (submissionId: number) => void;
}

const internProgress = [
  { name: 'Arjun Kumar', progress: 92, variant: 'blue' },
  { name: 'Sneha Verma', progress: 88, variant: 'green' },
  { name: 'Mihir Rao', progress: 71, variant: 'yellow' },
  { name: 'Neha Patil', progress: 48, variant: 'red' },
];

const recentSubmissions = [
  { id: 1, intern: 'Arjun K.', task: 'Build Login API', status: 'Pending', statusVariant: 'yellow' },
  { id: 2, intern: 'Sneha V.', task: 'DB Schema', status: 'Pending', statusVariant: 'yellow' },
  { id: 3, intern: 'Mihir R.', task: 'React Dashboard', status: 'Reviewed', statusVariant: 'green' },
];

const stats = [
  { label: 'Pending Reviews', value: 5, subtitle: '3 submitted today', color: 'blue' },
  { label: 'Evaluated', value: 18, subtitle: 'This sprint', color: 'green' },
  { label: 'Avg. Score Given', value: 76, subtitle: 'Out of 100', color: 'yellow' },
];

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onNavigate, onSelectSubmission }) => {
  return (
    <div className="view-container screen-trainer-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trainer Dashboard</h1>
          <p className="page-subtitle">Cohort A — 8 interns</p>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((item) => (
          <div key={item.label} className="admin-card">
            <div className="admin-card-body">
              <div className="admin-card-title">{item.label}</div>
              <div className="dashboard-metric">
                <span>{item.value}</span>
              </div>
              <div className="stat-note">{item.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Intern Progress — Cohort A</div>
          </div>
          <div className="admin-card-body">
            {internProgress.map((row) => (
              <div key={row.name} className="progress-group">
                <div className="progress-header">
                  <span>{row.name}</span>
                  <span className={`progress-value ${row.variant}`}>{row.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${row.variant}`} style={{ width: `${row.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Recent Submissions</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('trainer-submissions')}>
              View All
            </button>
          </div>
          <div className="admin-card-body">
            <div className="recent-list">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="recent-row">
                  <div>
                    <div className="recent-title">{submission.task}</div>
                    <div className="time-muted">{submission.intern}</div>
                  </div>
                  <div className="recent-actions">
                    <Badge variant={submission.statusVariant as any}>{submission.status}</Badge>
                    <button className="link-button" onClick={() => onSelectSubmission(submission.id)}>
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
