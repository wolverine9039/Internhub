import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { adminService } from '@/services/adminService';
import type {
  AnalyticsData, AnalyticsFilters,
} from '@/services/adminService';
import './AdminAnalytics.css';
import './AdminDashboard.css';

interface AdminAnalyticsProps {
  onNavigate?: (screen: string) => void;
}

// ── Date range presets ──
const DATE_PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
];

// ── Color palette ──
const STATUS_COLORS: Record<string, string> = {
  pending: '#6b748a',
  in_progress: '#5b8cff',
  submitted: '#f5c542',
  completed: '#43e8b0',
  overdue: '#ff6b6b',
};

const SCORE_COLORS = ['#ff6b6b', '#f5c542', '#6b748a', '#5b8cff', '#43e8b0'];

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="value">
          {p.name}: <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const AdminAnalytics: React.FC<AdminAnalyticsProps> = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState('all');

  const fetchAnalytics = useCallback(async (preset: string) => {
    try {
      setLoading(true);
      setError(null);

      const filters: AnalyticsFilters = {};
      if (preset !== 'all') {
        const now = new Date();
        const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filters.from = from.toISOString();
        filters.to = now.toISOString();
      }

      const result = await adminService.getAnalytics(filters);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(activePreset);
  }, [activePreset, fetchAnalytics]);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
  };

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // ── Radar data for score dimensions ──
  const radarData = data ? [
    { dimension: 'Code Quality', value: data.scoreDimensions.code_quality, max: 10 },
    { dimension: 'Functionality', value: data.scoreDimensions.functionality, max: 10 },
    { dimension: 'Documentation', value: data.scoreDimensions.documentation, max: 10 },
    { dimension: 'Timeliness', value: data.scoreDimensions.timeliness, max: 10 },
  ] : [];

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Analytics <span className="wf-note">Admin View</span></h1>
            <p className="page-subtitle">Program-wide performance insights</p>
          </div>
        </div>
        <div className="loader-wrapper">
          <div className="loading-wave">
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Analytics</h1>
          </div>
        </div>
        <div className="error-banner">
          {error}
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 12 }} onClick={() => fetchAnalytics(activePreset)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fade-in">
      {/* ── Header + Filters ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics <span className="wf-note">Admin View</span></h1>
          <p className="page-subtitle">Program-wide performance insights</p>
        </div>
        <div className="analytics-filter-bar">
          {DATE_PRESETS.map(p => (
            <button
              key={p.value}
              className={`date-filter-chip ${activePreset === p.value ? 'active' : ''}`}
              onClick={() => handlePresetChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Task Completion</div>
          <div className="kpi-value">{data.kpis.taskCompletionRate}%</div>
          <div className="kpi-sub">of all assigned tasks completed</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg. Eval Score</div>
          <div className="kpi-value">{data.kpis.avgEvaluationScore}<span style={{ fontSize: 14, color: 'var(--muted)' }}>/100</span></div>
          <div className="kpi-sub">{data.kpis.totalEvaluations} evaluations total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Submission Rate</div>
          <div className="kpi-value">{data.kpis.submissionRate}%</div>
          <div className="kpi-sub">tasks with at least one submission</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Interns</div>
          <div className="kpi-value">{data.kpis.activeInternCount}<span style={{ fontSize: 14, color: 'var(--muted)' }}>/{data.kpis.totalInternCount}</span></div>
          <div className="kpi-sub">currently active in program</div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="analytics-grid">
        {/* Task Status Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Task Status Breakdown</div>
          </div>
          <div className="chart-card-body">
            {data.taskStatusBreakdown.length === 0 ? (
              <div className="chart-empty">No task data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.taskStatusBreakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="status" type="category" width={90} tickFormatter={formatStatus} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]} barSize={22}>
                    {data.taskStatusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] || '#5b8cff'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Score Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Score Distribution</div>
          </div>
          <div className="chart-card-body">
            {data.scoreDistribution.every(d => d.count === 0) ? (
              <div className="chart-empty">No evaluation data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.scoreDistribution} margin={{ top: 10, right: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Evaluations" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.scoreDistribution.map((_, i) => (
                      <Cell key={i} fill={SCORE_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Dimensions Row ── */}
      <div className="analytics-grid">
        {/* Radar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Evaluation Dimensions</div>
            <span className="wf-note">avg out of 10</span>
          </div>
          <div className="chart-card-body">
            {radarData.every(d => d.value === 0) ? (
              <div className="chart-empty">No evaluation data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#5b8cff"
                    fill="rgba(91, 140, 255, 0.2)"
                    strokeWidth={2}
                    dot={{ fill: '#5b8cff', r: 4 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Dimension Breakdown</div>
          </div>
          <div className="chart-card-body">
            <div className="dimension-grid">
              {[
                { key: 'code_quality', label: 'Code Quality', color: '#5b8cff' },
                { key: 'functionality', label: 'Functionality', color: '#43e8b0' },
                { key: 'documentation', label: 'Documentation', color: '#f5c542' },
                { key: 'timeliness', label: 'Timeliness', color: '#ff6b6b' },
              ].map(dim => {
                const val = data.scoreDimensions[dim.key as keyof typeof data.scoreDimensions];
                return (
                  <div className="dimension-item" key={dim.key}>
                    <div className="dimension-label">{dim.label}</div>
                    <div className="dimension-value">
                      {val}<span className="dimension-max">/10</span>
                    </div>
                    <div className="dimension-bar-track">
                      <div
                        className="dimension-bar-fill"
                        style={{ width: `${(val / 10) * 100}%`, background: dim.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cohort Performance ── */}
      <div className="chart-card analytics-full">
        <div className="chart-card-header">
          <div className="chart-card-title">Cohort Performance</div>
          <span className="wf-note">{data.cohortPerformance.length} cohorts</span>
        </div>
        <div className="chart-card-body" style={{ padding: 0 }}>
          {data.cohortPerformance.length === 0 ? (
            <div className="chart-empty">No cohort data available</div>
          ) : (
            <div className="table-wrapper">
              <table className="cohort-perf-table">
                <thead>
                  <tr>
                    <th>Cohort</th>
                    <th>Status</th>
                    <th>Interns</th>
                    <th>Avg Score</th>
                    <th>Task Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cohortPerformance.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>
                        <span className={`cohort-status-badge ${c.status}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{c.internCount}</td>
                      <td>
                        <span className={`score-pill ${getScoreClass(c.avgScore)}`}>
                          {c.avgScore || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="mini-progress">
                          <div className="mini-progress-bar">
                            <div className="mini-progress-fill" style={{ width: `${c.taskProgress}%` }} />
                          </div>
                          <span className="mini-progress-label">{c.taskProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Leaderboard ── */}
      <div className="chart-card analytics-full">
        <div className="chart-card-header">
          <div className="chart-card-title">🏆 Top Performing Interns</div>
          <span className="wf-note">by avg score</span>
        </div>
        <div className="chart-card-body" style={{ padding: 0 }}>
          {data.topInterns.length === 0 ? (
            <div className="chart-empty">No evaluated interns yet</div>
          ) : (
            <div className="table-wrapper">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Intern</th>
                    <th>Cohort</th>
                    <th>Avg Score</th>
                    <th>Tasks Done</th>
                    <th>Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topInterns.map(intern => (
                    <tr key={intern.id}>
                      <td>
                        <span className={`rank-badge ${getRankClass(intern.rank)}`}>
                          {intern.rank}
                        </span>
                      </td>
                      <td>
                        <div className="intern-cell">
                          <div className={`avatar micro ${getRankClass(intern.rank) === 'gold' ? 'yellow' : getRankClass(intern.rank) === 'silver' ? 'blue' : 'green'}`}>
                            {intern.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <strong>{intern.name}</strong>
                        </div>
                      </td>
                      <td><span className="intern-cohort">{intern.cohort}</span></td>
                      <td>
                        <span className={`score-pill ${getScoreClass(intern.avgScore)}`}>
                          {intern.avgScore}
                        </span>
                      </td>
                      <td>{intern.tasksCompleted}</td>
                      <td>{intern.submissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
