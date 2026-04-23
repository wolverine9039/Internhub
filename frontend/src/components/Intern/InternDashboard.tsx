import React, { useEffect, useMemo, useState } from 'react';
import type { User, Task, Submission, Evaluation } from '@/types';
import { taskService } from '@/services/taskService';
import { submissionService } from '@/services/submissionService';
import { evaluationService } from '@/services/evaluationService';
import { internService } from '@/services/internService';
import type { InternProfile } from '@/services/internService';
import Badge from '@/components/Shared/Badge';
import './InternModule.css';
import LoadingWave from '@/components/Shared/LoadingWave';

interface InternDashboardProps {
  user: User | null;
  onNavigate: (screen: string) => void;
}

interface DashboardData {
  tasks: Task[];
  submissions: Submission[];
  evaluations: Evaluation[];
}

const terminalStatuses = new Set(['submitted', 'completed']);

function toDateLabel(date?: string | null) {
  if (!date) return 'No due date';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusVariant(status: string): 'blue' | 'green' | 'red' | 'yellow' | 'gray' {
  if (status === 'completed' || status === 'reviewed') return 'green';
  if (status === 'submitted') return 'blue';
  if (status === 'overdue') return 'red';
  if (status === 'in_progress') return 'yellow';
  return 'gray';
}

const InternDashboard: React.FC<InternDashboardProps> = ({ user, onNavigate }) => {
  const [data, setData] = useState<DashboardData>({ tasks: [], submissions: [], evaluations: [] });
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setData({ tasks: [], submissions: [], evaluations: [] });
        setLoading(false);
        return;
      }

      try {
        const [taskRes, submissionRes, profileRes] = await Promise.all([
          taskService.getTasks({ assigned_to: user.id, page: 1, page_size: 200, sort: 'due_date' }),
          submissionService.getSubmissions({ intern_id: user.id, page: 1, page_size: 200 }),
          internService.getProfile().catch(() => null),
        ]);

        setProfile(profileRes);

        const submissionIds = new Set(submissionRes.items.map((item) => item.id));
        const evalRes = await evaluationService.getEvaluations({ page: 1, page_size: 200 });
        const evaluations = evalRes.items.filter((item) => submissionIds.has(item.submission_id));

        setData({ tasks: taskRes.items, submissions: submissionRes.items, evaluations });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(now.getDate() + 7);

    const dueThisWeek = data.tasks.filter((task) => {
      if (!task.due_date || terminalStatuses.has(task.status)) return false;
      const due = new Date(task.due_date);
      return due >= now && due <= weekAhead;
    }).length;

    const avgScore = data.evaluations.length
      ? Math.round((data.evaluations.reduce((sum, item) => sum + (item.score || 0), 0) / data.evaluations.length) * 10) / 10
      : 0;

    return {
      assigned: data.tasks.length,
      dueThisWeek,
      submitted: data.submissions.length,
      evaluated: data.evaluations.length,
      avgScore,
    };
  }, [data]);

  const upcomingTasks = useMemo(
    () =>
      data.tasks
        .filter((task) => !terminalStatuses.has(task.status))
        .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
        .slice(0, 4),
    [data.tasks]
  );

  const recentEvaluations = useMemo(
    () => [...data.evaluations].sort((a, b) => b.evaluated_at.localeCompare(a.evaluated_at)).slice(0, 3),
    [data.evaluations]
  );

  if (loading) {
    return (
      <LoadingWave />
    );
  }

  return (
    <div className="intern-module fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">My Dashboard <span className="wf-note">Intern Module</span></div>
          <div className="page-subtitle">Welcome back, {user?.name || 'Intern'}.</div>
        </div>
      </div>

      {/* ── Profile Info Card — Cohort & Trainer ── */}
      {profile && (profile.cohort_name || profile.trainers.length > 0) && (
        <div className="intern-profile-card">
          {profile.cohort_name && (
            <div className="intern-profile-item">
              <span className="intern-profile-icon">🎓</span>
              <div>
                <div className="intern-profile-label">Cohort</div>
                <div className="intern-profile-value">{profile.cohort_name}</div>
                {profile.cohort_status && (
                  <Badge variant={profile.cohort_status === 'active' ? 'green' : profile.cohort_status === 'completed' ? 'blue' : 'yellow'}>
                    {profile.cohort_status}
                  </Badge>
                )}
              </div>
            </div>
          )}
          {profile.trainers.length > 0 && (
            <div className="intern-profile-item">
              <span className="intern-profile-icon">👨‍🏫</span>
              <div>
                <div className="intern-profile-label">Assigned Trainer{profile.trainers.length > 1 ? 's' : ''}</div>
                <div className="intern-profile-value">
                  {profile.trainers.map(t => t.name).join(', ')}
                </div>
                <div className="intern-profile-email">
                  {profile.trainers.map(t => t.email).join(' · ')}
                </div>
              </div>
            </div>
          )}
          {profile.cohort_start && (
            <div className="intern-profile-item">
              <span className="intern-profile-icon">📅</span>
              <div>
                <div className="intern-profile-label">Program Period</div>
                <div className="intern-profile-value">
                  {new Date(profile.cohort_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {profile.cohort_end && ` — ${new Date(profile.cohort_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="stat-grid intern-stat-grid">
        <div className="stat-card intern-stat-card blue">
          <div className="stat-label">Tasks Assigned</div>
          <div className="stat-value">{stats.assigned}</div>
          <div className="stat-delta">{stats.dueThisWeek} due in next 7 days</div>
        </div>
        <div className="stat-card intern-stat-card green">
          <div className="stat-label">Submissions</div>
          <div className="stat-value">{stats.submitted}</div>
          <div className="stat-delta">{stats.evaluated} evaluated</div>
        </div>
        <div className="stat-card intern-stat-card yellow">
          <div className="stat-label">Avg. Score</div>
          <div className="stat-value">{stats.avgScore}</div>
          <div className="stat-delta">Trainer evaluations</div>
        </div>
      </div>

      <div className="two-col">
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Upcoming Tasks</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('intern-tasks')}>View All</button>
          </div>
          <div className="admin-card-body">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="intern-list-item">
                <div>
                  <div className="intern-item-title">{task.title}</div>
                  <div className="intern-item-meta">{task.project_title || 'Project'} · Due {toDateLabel(task.due_date)}</div>
                </div>
                <Badge variant={statusVariant(task.status)}>{task.status.replace('_', ' ')}</Badge>
              </div>
            ))}
            {!upcomingTasks.length && <div className="page-subtitle">No pending tasks right now.</div>}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><div className="admin-card-title">Recent Feedback</div></div>
          <div className="admin-card-body">
            {recentEvaluations.map((item) => (
              <div key={item.id} className="intern-feedback-card">
                <div className="intern-feedback-head">
                  <strong>Submission #{item.submission_id}</strong>
                  <Badge variant={item.score && item.score >= 85 ? 'green' : 'blue'}>{item.score || 0}/100</Badge>
                </div>
                <div className="intern-item-meta">{item.feedback || 'Feedback will appear once reviewed.'}</div>
              </div>
            ))}
            {!recentEvaluations.length && <div className="page-subtitle">No evaluations yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternDashboard;

