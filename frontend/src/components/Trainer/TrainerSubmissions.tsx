import React, { useMemo, useState } from 'react';
import Badge from '@/components/Shared/Badge';
import type { Submission } from '@/types';

interface TrainerSubmissionsProps {
  onNavigate: (screen: string) => void;
  onSelectSubmission: (submission: Submission) => void;
}

const initialSubmissions: Submission[] = [
  {
    id: 1,
    task_id: 1,
    intern_id: 11,
    attempt_no: 1,
    github_url: 'https://github.com/arjun/internhub-auth',
    demo_url: undefined,
    file_url: undefined,
    notes: 'Includes JWT authentication with role-based middleware.',
    status: 'submitted',
    submitted_at: '2025-06-17T09:42:00Z',
    reviewed_at: undefined,
    updated_at: '2025-06-17T09:42:00Z',
    task_title: 'Build Login API',
    intern_name: 'Arjun Kumar',
  },
  {
    id: 2,
    task_id: 2,
    intern_id: 12,
    attempt_no: 1,
    github_url: 'https://drive.google.com/schema-diagram',
    demo_url: undefined,
    file_url: undefined,
    notes: 'ER diagram and SQL schema file. Includes 6 tables with constraints.',
    status: 'submitted',
    submitted_at: '2025-06-16T15:10:00Z',
    reviewed_at: undefined,
    updated_at: '2025-06-16T15:10:00Z',
    task_title: 'Database Schema Design',
    intern_name: 'Sneha Verma',
  },
  {
    id: 3,
    task_id: 3,
    intern_id: 13,
    attempt_no: 1,
    github_url: 'https://github.com/mihir/react-dashboard',
    demo_url: undefined,
    file_url: undefined,
    notes: 'Evaluation complete. Feedback provided on component structure.',
    status: 'reviewed',
    submitted_at: '2025-06-15T11:00:00Z',
    reviewed_at: '2025-06-16T09:00:00Z',
    updated_at: '2025-06-16T09:00:00Z',
    task_title: 'React Dashboard UI',
    intern_name: 'Mihir Rao',
  },
];

const statusOptions: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'submitted' },
  { label: 'Reviewed', value: 'reviewed' },
];

const variantForStatus = (status: string) => {
  if (status === 'reviewed') return 'green';
  if (status === 'submitted') return 'yellow';
  return 'gray';
};

const TrainerSubmissions: React.FC<TrainerSubmissionsProps> = ({ onNavigate, onSelectSubmission }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filteredSubmissions = useMemo(
    () => initialSubmissions.filter((item) => {
      const searchText = `${item.task_title ?? ''} ${item.intern_name ?? ''} ${item.notes ?? ''}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesStatus = status ? item.status === status : true;
      return matchesSearch && matchesStatus;
    }),
    [search, status]
  );

  return (
    <div className="view-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submission Review</h1>
          <p className="page-subtitle">Pending intern submissions</p>
        </div>
      </div>

      <div className="search-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search submissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="btn-group">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={`filter-chip ${status === option.value ? 'active' : ''}`}
              onClick={() => setStatus(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          {filteredSubmissions.length === 0 ? (
            <div className="empty-state">No submissions match your filters.</div>
          ) : (
            <div className="submission-list">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="submission-card">
                  <div className="submission-title">{submission.task_title}</div>
                  <div className="time-muted">
                    {submission.intern_name} · Submitted {new Date(submission.submitted_at).toLocaleString()}
                  </div>
                  <p className="submission-copy">{submission.notes}</p>
                  <div className="submission-meta">
                    <a href={submission.github_url} target="_blank" rel="noreferrer" className="link-button">
                      {submission.github_url}
                    </a>
                    <Badge variant={variantForStatus(submission.status)}>{submission.status === 'submitted' ? 'Pending Review' : 'Reviewed'}</Badge>
                  </div>
                  <div className="submission-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      onClick={() => {
                        onSelectSubmission(submission);
                        onNavigate('trainer-evaluation');
                      }}
                    >
                      Review & Score
                    </button>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => alert('Revision request queued')}>
                      Request Revision
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerSubmissions;
