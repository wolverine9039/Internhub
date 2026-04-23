import React, { useEffect, useState, useMemo } from 'react';
import Badge from '@/components/Shared/Badge';
import LoadingWave from '@/components/Shared/LoadingWave';

interface TrainerIntern {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  cohort_name: string | null;
  total_tasks: number;
  completed_tasks: number;
  avg_score: number | null;
}

interface TrainerInternsProps {
  onNavigate?: (screen: string) => void;
}

const TrainerInterns: React.FC<TrainerInternsProps> = () => {
  const [interns, setInterns] = useState<TrainerIntern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const token = localStorage.getItem('token');
        const resp = await fetch('/api/trainer/my-interns', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (resp.ok) {
          const data = await resp.json();
          setInterns(data);
        } else {
          setError(`API returned ${resp.status}`);
          setInterns([]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setInterns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInterns();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return interns;
    const q = search.toLowerCase();
    return interns.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      (i.cohort_name || '').toLowerCase().includes(q)
    );
  }, [interns, search]);

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const progressPercent = (intern: TrainerIntern) =>
    intern.total_tasks > 0 ? Math.round((intern.completed_tasks / intern.total_tasks) * 100) : 0;

  const progressColor = (pct: number) => {
    if (pct >= 80) return 'green';
    if (pct >= 50) return 'yellow';
    if (pct > 0) return 'red';
    return 'gray';
  };

  return (
    <div className="view-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Interns</h1>
          <p className="page-subtitle">
            {(() => {
              if (loading) return 'Loading...';
              if (error) return `Error: ${error}`;
              return `${interns.length} interns across your projects`;
            })()}
          </p>
        </div>
      </div>

      <div className="search-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, or cohort..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              return (
                <div className="empty-state">
                  {search ? 'No interns match your search.' : 'No interns assigned to your projects yet.'}
                </div>
              );
            }
            return (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Intern</th>
                    <th>Cohort</th>
                    <th>Tasks</th>
                    <th>Progress</th>
                    <th>Avg Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((intern) => {
                    const pct = progressPercent(intern);
                    const color = progressColor(pct);
                    return (
                      <tr key={intern.id}>
                        <td>
                          <div className="user-cell">
                            <div className="avatar micro blue">{getInitials(intern.name)}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{intern.name}</div>
                              <div className="time-muted">{intern.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{intern.cohort_name || '—'}</td>
                        <td>{intern.completed_tasks}/{intern.total_tasks}</td>
                        <td>
                          <div className="progress-bar" style={{ width: '80px', height: '6px' }}>
                            <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`progress-value ${color}`} style={{ fontSize: '11px', marginLeft: '6px' }}>{pct}%</span>
                        </td>
                        <td>
                          {intern.avg_score === null ? (
                            <span className="time-muted">—</span>
                          ) : (
                            <span style={{ fontWeight: 600 }}>{intern.avg_score}</span>
                          )}
                        </td>
                        <td>
                          <Badge variant={intern.is_active ? 'green' : 'gray'}>
                            {intern.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
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

export default TrainerInterns;
