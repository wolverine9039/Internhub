import React, { useEffect, useState } from 'react';
import Badge from '@/components/Shared/Badge';
import { getErrorMessage } from '@/utils/errorUtils';
import LoadingWave from '@/components/Shared/LoadingWave';

interface TrainerEvaluation {
  id: number;
  submission_id: number;
  trainer_id: number;
  code_quality: number | null;
  functionality: number | null;
  documentation: number | null;
  timeliness: number | null;
  score: number | null;
  feedback: string | null;
  strengths: string | null;
  improvements: string | null;
  evaluated_at: string | null;
  updated_at: string | null;
  task_title?: string;
  intern_name?: string;
}

interface TrainerMyEvaluationsProps {
  onNavigate?: (screen: string) => void;
}

const TrainerMyEvaluations: React.FC<TrainerMyEvaluationsProps> = () => {
  const [evaluations, setEvaluations] = useState<TrainerEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvals = async () => {
      try {
        const token = localStorage.getItem('token');
        const resp = await fetch('/api/trainer/my-evaluations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (resp.ok) {
          const data = await resp.json();
          setEvaluations(data);
        } else {
          setError(`API returned ${resp.status}`);
          setEvaluations([]);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load'));
        setEvaluations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvals();
  }, []);

  const scoreColor = (score: number | null) => {
    if (score === null) return 'gray';
    if (score >= 30) return 'green';
    if (score >= 20) return 'yellow';
    return 'red';
  };

  return (
    <div className="view-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Evaluations</h1>
          <p className="page-subtitle">
            {(() => {
              if (loading) return 'Loading...';
              if (error) return `Error: ${error}`;
              return `${evaluations.length} evaluations submitted`;
            })()}
          </p>
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
            if (evaluations.length === 0) {
              return <div className="empty-state">You haven't submitted any evaluations yet.</div>;
            }
            return (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Intern</th>
                    <th>Task</th>
                    <th>Score</th>
                    <th>Code</th>
                    <th>Func</th>
                    <th>Docs</th>
                    <th>Time</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev) => (
                    <React.Fragment key={ev.id}>
                      <tr>
                        <td style={{ fontWeight: 600 }}>{ev.intern_name || '—'}</td>
                        <td>{ev.task_title || '—'}</td>
                        <td>
                          <Badge variant={scoreColor(ev.score)}>{ev.score ?? '—'}/40</Badge>
                        </td>
                        <td>{ev.code_quality ?? '—'}</td>
                        <td>{ev.functionality ?? '—'}</td>
                        <td>{ev.documentation ?? '—'}</td>
                        <td>{ev.timeliness ?? '—'}</td>
                        <td className="time-muted">
                          {ev.evaluated_at ? new Date(ev.evaluated_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <button
                            className="link-button"
                            onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
                            type="button"
                          >
                            {expandedId === ev.id ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedId === ev.id && (
                        <tr>
                          <td colSpan={9}>
                            <div className="evaluation-detail-panel" style={{
                              background: 'var(--surface2)',
                              borderRadius: '8px',
                              padding: '16px',
                              margin: '4px 0',
                              display: 'grid',
                              gap: '12px',
                            }}>
                              {ev.strengths && (
                                <div>
                                  <strong style={{ fontSize: '12px', color: 'var(--accent3)' }}>Strengths</strong>
                                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text)' }}>{ev.strengths}</p>
                                </div>
                              )}
                              {ev.improvements && (
                                <div>
                                  <strong style={{ fontSize: '12px', color: 'var(--accent4)' }}>Areas for Improvement</strong>
                                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text)' }}>{ev.improvements}</p>
                                </div>
                              )}
                              {ev.feedback && !ev.strengths && !ev.improvements && (
                                <div>
                                  <strong style={{ fontSize: '12px', color: 'var(--muted)' }}>Feedback</strong>
                                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text)' }}>{ev.feedback}</p>
                                </div>
                              )}
                              {!ev.strengths && !ev.improvements && !ev.feedback && (
                                <p className="time-muted">No written feedback recorded.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default TrainerMyEvaluations;
