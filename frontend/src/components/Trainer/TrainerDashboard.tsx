import React, { useEffect, useState } from 'react';
import StatCard from '@/components/Shared/StatCard';
import Badge from '@/components/Shared/Badge';
import { trainerService } from '@/services/trainerService';
import type { TrainerStats, TrainerDeadline } from '@/services/trainerService';
import type { Submission } from '@/types';
import type { BadgeVariant } from '@/utils/errorUtils';

interface TrainerDashboardProps {
  onNavigate: (screen: string) => void;
  onSelectSubmission: (submission: Submission) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function daysUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onNavigate, onSelectSubmission }) => {
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [deadlines, setDeadlines] = useState<TrainerDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, submissionsData, deadlinesData] = await Promise.all([
          trainerService.getStats(),
          trainerService.getMySubmissions().catch(() => []),
          trainerService.getUpcomingDeadlines().catch(() => []),
        ]);
        setStats(statsData);
        setRecentSubmissions(submissionsData.slice(0, 5));
        setDeadlines(deadlinesData);
      } catch {
        setStats({ pendingReviews: 0, totalEvaluated: 0, avgScore: 0, internCount: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statusVariant = (status: string): BadgeVariant => {
    if (status === 'reviewed') return 'green';
    if (status === 'submitted' || status === 'pending') return 'yellow';
    if (status === 'revision_requested') return 'red';
    return 'gray';
  };

  const statusLabel = (status: string) => {
    if (status === 'submitted' || status === 'pending') return 'Pending';
    if (status === 'reviewed') return 'Reviewed';
    if (status === 'revision_requested') return 'Revision';
    return status;
  };

  return (
    <div className="screen-admin-dashboard fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard <span className="wf-note">Trainer View</span></div>
          <div className="page-subtitle">Your assignments — live data</div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stat-grid">
        {loading ? (
          <>
            <div className="stat-card loading-placeholder" />
            <div className="stat-card loading-placeholder" />
            <div className="stat-card loading-placeholder" />
            <div className="stat-card loading-placeholder" />
          </>
        ) : (
          <>
            <StatCard color="yellow" label="Pending Reviews" value={stats?.pendingReviews ?? 0} />
            <StatCard color="green" label="Evaluated" value={stats?.totalEvaluated ?? 0} />
            <StatCard color="blue" label="Avg. Score" value={stats?.avgScore ?? 0} delta="out of 40" />
            <StatCard color="red" label="My Interns" value={stats?.internCount ?? 0} />
          </>
        )}
      </div>

      <div className="two-col">
        {/* ── Recent Submissions ── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Recent Submissions</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('trainer-submissions')}>
              View All
            </button>
          </div>
          {(() => {
            if (loading) {
              return (
                <div className="loader-wrapper">
                  <div className="loading-wave">
                    <div className="loading-bar"></div>
                    <div className="loading-bar"></div>
                    <div className="loading-bar"></div>
                    <div className="loading-bar"></div>
                  </div>
                </div>
              );
            }
            if (recentSubmissions.length === 0) {
              return <div className="empty-state">No submissions yet</div>;
            }
            return (
              <div className="admin-card-body">
                <div className="recent-list">
                  {recentSubmissions.map((sub) => (
                    <div key={sub.id} className="recent-row">
                      <div>
                        <div className="recent-title">{sub.task_title}</div>
                        <div className="time-muted">{sub.intern_name} · {timeAgo(sub.submitted_at)}</div>
                      </div>
                      <div className="recent-actions">
                        <Badge variant={statusVariant(sub.status)}>{statusLabel(sub.status)}</Badge>
                        {(sub.status === 'submitted' || sub.status === 'pending') && (
                          <button className="link-button" onClick={() => onSelectSubmission(sub)}>
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Upcoming Deadlines ── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Upcoming Deadlines</div>
            <span className="wf-note">{deadlines.length} tasks</span>
          </div>
          <div className="admin-card-body">
            {(() => {
              if (loading) {
                return (
                  <div className="loader-wrapper">
                    <div className="loading-wave">
                      <div className="loading-bar"></div>
                      <div className="loading-bar"></div>
                      <div className="loading-bar"></div>
                      <div className="loading-bar"></div>
                    </div>
                  </div>
                );
              }
              if (deadlines.length === 0) {
                return <div className="empty-state">No upcoming deadlines</div>;
              }
              return (
                <div className="deadline-list">
                  {deadlines.map((dl) => {
                    const days = Math.ceil((new Date(dl.due_date).getTime() - Date.now()) / 86400000);
                    let color: BadgeVariant = 'green';
                    if (days <= 2) color = 'red';
                    else if (days <= 7) color = 'yellow';
                    return (
                      <div className="deadline-item" key={dl.id}>
                        <div>
                          <span>{dl.title}</span>
                          <span className="deadline-project"> — {dl.project_title}</span>
                        </div>
                        <Badge variant={color}>{daysUntil(dl.due_date)}</Badge>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
