import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Badge from '@/components/Shared/Badge';
import { trainerService } from '@/services/trainerService';
import type { Submission } from '@/types';
import LoadingWave from '@/components/Shared/LoadingWave';

interface TrainerSubmissionsProps {
  onNavigate: (screen: string) => void;
  onSelectSubmission: (submission: Submission) => void;
}

const statusOptions: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'submitted' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Revision', value: 'revision_requested' },
];

const variantForStatus = (status: string) => {
  if (status === 'reviewed') return 'green';
  if (status === 'submitted' || status === 'pending') return 'yellow';
  if (status === 'revision_requested') return 'red';
  return 'gray';
};

const labelForStatus = (status: string) => {
  if (status === 'submitted' || status === 'pending') return 'Pending Review';
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'revision_requested') return 'Revision Requested';
  return status;
};

const TrainerSubmissions: React.FC<TrainerSubmissionsProps> = ({ onNavigate, onSelectSubmission }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trainerService.getMySubmissions(status || undefined, search || undefined);
      setSubmissions(data);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Client-side search filtering on top of server results
  const filtered = useMemo(() => {
    if (!search) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(s => {
      const text = `${s.task_title ?? ''} ${s.intern_name ?? ''} ${s.notes ?? ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [submissions, search]);

  const handleRequestRevision = async (submission: Submission) => {
    setUpdatingId(submission.id);
    try {
      await trainerService.updateSubmissionStatus(submission.id, 'revision_requested');
      // Refresh list
      await fetchSubmissions();
    } catch (err) {
      console.error('Failed to request revision', err);
      alert('Failed to request revision. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="view-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submission Review</h1>
          <p className="page-subtitle">Review and evaluate intern submissions</p>
        </div>
      </div>

      <div className="search-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search by task or intern name..."
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
          {(() => {
            if (loading) {
              return (
                <LoadingWave />
              );
            }
            if (filtered.length === 0) {
              return <div className="empty-state">No submissions match your filters.</div>;
            }
            return (
              <div className="submission-list">
                {filtered.map((submission) => (
                  <div key={submission.id} className="submission-card">
                    <div className="submission-title">{submission.task_title}</div>
                    <div className="time-muted">
                      {submission.intern_name} · Submitted {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                    {submission.notes && <p className="submission-copy">{submission.notes}</p>}
                    <div className="submission-meta">
                      <a href={submission.github_url} target="_blank" rel="noreferrer" className="link-button">
                        {submission.github_url}
                      </a>
                      <Badge variant={variantForStatus(submission.status)}>{labelForStatus(submission.status)}</Badge>
                    </div>
                    <div className="submission-actions">
                      {(submission.status === 'submitted' || submission.status === 'pending') && (
                        <>
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
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            disabled={updatingId === submission.id}
                            onClick={() => handleRequestRevision(submission)}
                          >
                            {updatingId === submission.id ? 'Sending...' : 'Request Revision'}
                          </button>
                        </>
                      )}
                      {submission.status === 'reviewed' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          type="button"
                          onClick={() => {
                            onSelectSubmission(submission);
                            onNavigate('trainer-evaluation');
                          }}
                        >
                          View Evaluation
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default TrainerSubmissions;
