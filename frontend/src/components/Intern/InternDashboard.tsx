import React, { useEffect, useMemo, useState } from 'react';
import type { User, Task, Submission, Evaluation } from '@/types';
import { taskService } from '@/services/taskService';
import { submissionService } from '@/services/submissionService';
import { evaluationService } from '@/services/evaluationService';
import Badge from '@/components/Shared/Badge';
import './InternModule.css';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setData({ tasks: [], submissions: [], evaluations: [] });
        setLoading(false);
        return;
      }

      try {
        const [taskRes, submissionRes] = await Promise.all([
          taskService.getTasks({ assigned_to: user.id, page: 1, page_size: 200, sort: 'due_date' }),
          submissionService.getSubmissions({ intern_id: user.id, page: 1, page_size: 200 }),
        ]);

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
    return <div className="loading-container"><div className="loading-spinner" /> Loading dashboard...</div>;
  }

  return (
    <div className="intern-module fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">My Dashboard <span className="wf-note">Intern Module</span></div>
          <div className="page-subtitle">Welcome back, {user?.name || 'Intern'}.</div>
        </div>
      </div>

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
