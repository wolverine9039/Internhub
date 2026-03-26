import React, { useEffect, useMemo, useState } from 'react';
import type { User, Task, Submission, Evaluation } from '@/types';
import { taskService } from '@/services/taskService';
import { submissionService } from '@/services/submissionService';
import { evaluationService } from '@/services/evaluationService';
import './InternModule.css';

interface InternProgressProps {
  user: User | null;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, item) => sum + item, 0) / values.length) * 10) / 10;
}

const InternProgress: React.FC<InternProgressProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [taskRes, subRes, evalRes] = await Promise.all([
          taskService.getTasks({ assigned_to: user.id, page: 1, page_size: 300 }),
          submissionService.getSubmissions({ intern_id: user.id, page: 1, page_size: 300 }),
          evaluationService.getEvaluations({ page: 1, page_size: 500 }),
        ]);

        const subIds = new Set(subRes.items.map((item) => item.id));
        const filteredEvaluations = evalRes.items.filter((item) => subIds.has(item.submission_id));

        setTasks(taskRes.items);
        setSubmissions(subRes.items);
        setEvaluations(filteredEvaluations);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const submittedCount = tasks.filter((task) => task.status === 'submitted').length;
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
    const pending = tasks.filter((task) => task.status === 'pending').length;
    const overdue = tasks.filter((task) => task.status === 'overdue').length;

    const completionRate = total ? Math.round((((completed + submittedCount) / total) * 100) * 10) / 10 : 0;
    const avgScore = evaluations.length ? average(evaluations.map((item) => item.score || 0)) : 0;

    const codeQuality = average(evaluations.map((item) => item.code_quality || 0));
    const functionality = average(evaluations.map((item) => item.functionality || 0));
    const documentation = average(evaluations.map((item) => item.documentation || 0));
    const timeliness = average(evaluations.map((item) => item.timeliness || 0));

    return {
      completionRate,
      avgScore,
      openTasks: pending + inProgress + overdue,
      statusCounts: { pending, inProgress, submittedCount, completed, overdue },
      skills: [
        { label: 'Code Quality', value: codeQuality * 10, cls: 'blue' },
        { label: 'Functionality', value: functionality * 10, cls: 'green' },
        { label: 'Documentation', value: documentation * 10, cls: 'yellow' },
        { label: 'Timeliness', value: timeliness * 10, cls: 'blue' },
      ],
      barSeries: evaluations.slice(0, 6).map((item) => ({ key: item.id, score: item.score || 0 })),
    };
  }, [evaluations, tasks]);

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner" /> Loading progress...</div>;
  }

  return (
    <div className="intern-module fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">My Progress <span className="wf-note">Intern Module</span></div>
          <div className="page-subtitle">Track completion and evaluation metrics from trainer reviews.</div>
        </div>
      </div>

      <div className="stat-grid intern-stat-grid">
        <div className="stat-card intern-stat-card blue">
          <div className="stat-label">Completion Rate</div>
          <div className="stat-value">{stats.completionRate}</div>
          <div className="stat-delta">% completed or submitted</div>
        </div>
        <div className="stat-card intern-stat-card green">
          <div className="stat-label">Average Score</div>
          <div className="stat-value">{stats.avgScore}</div>
          <div className="stat-delta">Trainer evaluated submissions</div>
        </div>
        <div className="stat-card intern-stat-card yellow">
          <div className="stat-label">Open Tasks</div>
          <div className="stat-value">{stats.openTasks}</div>
          <div className="stat-delta">Pending + in progress + overdue</div>
        </div>
      </div>

      <div className="two-col">
        <div className="admin-card">
          <div className="admin-card-header"><div className="admin-card-title">Score History</div></div>
          <div className="admin-card-body">
            <div className="intern-bar-chart">
              {stats.barSeries.map((item) => (
                <div key={item.key} className="intern-bar" style={{ height: `${item.score}%` }} />
              ))}
            </div>
            {!stats.barSeries.length && <div className="page-subtitle">No evaluated submissions yet.</div>}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><div className="admin-card-title">Skill Breakdown</div></div>
          <div className="admin-card-body">
            {stats.skills.map((skill) => (
              <div key={skill.label} className="intern-skill-row">
                <div className="intern-skill-head">
                  <span>{skill.label}</span>
                  <span>{skill.value}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${skill.cls}`} style={{ width: `${skill.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header"><div className="admin-card-title">Evaluation Details</div></div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Submission</th>
                <th>Score</th>
                <th>Code</th>
                <th>Functionality</th>
                <th>Docs</th>
                <th>Timeliness</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((item) => (
                <tr key={item.id}>
                  <td>#{item.submission_id}</td>
                  <td><strong>{item.score || 0}</strong>/100</td>
                  <td>{item.code_quality ?? '—'}</td>
                  <td>{item.functionality ?? '—'}</td>
                  <td>{item.documentation ?? '—'}</td>
                  <td>{item.timeliness ?? '—'}</td>
                </tr>
              ))}
              {!evaluations.length && (
                <tr>
                  <td colSpan={6} className="time-muted">No evaluations available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="intern-meta-row">
        <span>Submissions: {submissions.length}</span>
        <span>Completed Tasks: {stats.statusCounts.completed}</span>
        <span>Submitted Tasks: {stats.statusCounts.submittedCount}</span>
      </div>
    </div>
  );
};

export default InternProgress;
