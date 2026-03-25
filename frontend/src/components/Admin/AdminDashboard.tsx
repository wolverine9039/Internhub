import React, { useEffect, useState } from 'react';
import StatCard from '@/components/Shared/StatCard';
import Badge from '@/components/Shared/Badge';
import { adminService } from '@/services/adminService';
import type { DashboardStats } from '@/types';
import type { ActivityItem, CohortProgress, UpcomingDeadline } from '@/services/adminService';
import './AdminDashboard.css';

interface AdminDashboardProps {
    onNavigate: (screen: string) => void;
}

const ACTIVITY_META: Record<string, { badge: string; color: string }> = {
    submission: { badge: 'Submitted', color: 'blue' },
    evaluation: { badge: 'Evaluated', color: 'green' },
    task_assigned: { badge: 'Assigned', color: 'yellow' },
    user_joined: { badge: 'Joined', color: 'gray' },
};

const PROGRESS_COLORS = ['blue', 'green', 'yellow', 'red'];

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

function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [cohorts, setCohorts] = useState<CohortProgress[]>([]);
    const [deadlines, setDeadlines] = useState<UpcomingDeadline[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);

    const triggerExport = async (resource: 'users' | 'tasks' | 'submissions' | 'evaluations') => {
        setExporting(resource);
        setExportMenuOpen(false);
        try {
            await adminService.exportData(resource);
        } catch (error) {
            console.error('Export failed', error);
            alert('Export failed. Please try again later.');
        } finally {
            setExporting(null);
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsData, activityData, cohortsData, deadlinesData] = await Promise.all([
                    adminService.getDashboardStats(),
                    adminService.getRecentActivity().catch(() => []),
                    adminService.getCohortProgress().catch(() => []),
                    adminService.getUpcomingDeadlines().catch(() => []),
                ]);
                setStats(statsData);
                setActivity(activityData);
                setCohorts(cohortsData);
                setDeadlines(deadlinesData);
            } catch {
                setStats({ totalInterns: 0, activeProjects: 0, pendingSubmissions: 0, evaluationsDue: 0 });
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    return (
        <div className="screen-admin-dashboard fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">Dashboard <span className="wf-note">Admin View</span></div>
                    <div className="page-subtitle">Program overview — live data</div>
                </div>
                <div className="btn-group">
                    <div style={{ position: 'relative' }}>
                        <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => setExportMenuOpen(!exportMenuOpen)}
                            disabled={exporting !== null}
                        >
                            {exporting ? `Exporting...` : 'Export Report ▾'}
                        </button>
                        {exportMenuOpen && (
                            <div className="shadow" style={{
                                position: 'absolute', top: 'calc(100% + 4px)', right: 0, 
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: '6px', padding: '0.25rem', zIndex: 10,
                                display: 'flex', flexDirection: 'column', gap: '2px',
                                minWidth: '150px'
                            }}>
                                <button className="btn btn-ghost btn-sm" style={{justifyContent: 'flex-start'}} onClick={() => triggerExport('users')}>Users CSV</button>
                                <button className="btn btn-ghost btn-sm" style={{justifyContent: 'flex-start'}} onClick={() => triggerExport('tasks')}>Tasks CSV</button>
                                <button className="btn btn-ghost btn-sm" style={{justifyContent: 'flex-start'}} onClick={() => triggerExport('submissions')}>Submissions CSV</button>
                                <button className="btn btn-ghost btn-sm" style={{justifyContent: 'flex-start'}} onClick={() => triggerExport('evaluations')}>Evaluations CSV</button>
                            </div>
                        )}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => onNavigate('admin-users')}>+ Add User</button>
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
                        <StatCard color="blue" label="Total Interns" value={stats?.totalInterns ?? 0} />
                        <StatCard color="green" label="Active Projects" value={stats?.activeProjects ?? 0} />
                        <StatCard color="yellow" label="Pending Submissions" value={stats?.pendingSubmissions ?? 0} />
                        <StatCard color="red" label="Evaluations Due" value={stats?.evaluationsDue ?? 0} />
                    </>
                )}
            </div>

            <div className="two-col">
                {/* ── Recent Activity (LIVE) ── */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <div className="admin-card-title">Recent Activity</div>
                        <span className="wf-note">Live feed</span>
                    </div>
                    {loading ? (
                        <div className="loading-container"><div className="loading-spinner" /> Loading…</div>
                    ) : activity.length === 0 ? (
                        <div className="empty-state">No recent activity</div>
                    ) : (
                        <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activity.map((item, i) => {
                                    const meta = ACTIVITY_META[item.type] || { badge: item.type, color: 'gray' };
                                    return (
                                        <tr key={`${item.type}-${item.id}-${i}`}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className={`avatar micro ${meta.color}`}>{getInitials(item.user_name)}</div>
                                                    {item.user_name}
                                                </div>
                                            </td>
                                            <td><Badge variant={meta.color as 'blue' | 'green' | 'yellow' | 'red' | 'gray'}>{meta.badge}</Badge> {item.task_title}</td>
                                            <td className="time-muted">{timeAgo(item.timestamp)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>

                {/* ── Cohort Progress (LIVE) ── */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <div className="admin-card-title">Cohort Progress</div>
                        <span className="wf-note">{cohorts.length} cohorts</span>
                    </div>
                    <div className="admin-card-body">
                        {loading ? (
                            <div className="loading-container"><div className="loading-spinner" /> Loading…</div>
                        ) : cohorts.length === 0 ? (
                            <div className="empty-state">No cohorts found</div>
                        ) : (
                            <>
                                {cohorts.map((cohort, i) => {
                                    const color = PROGRESS_COLORS[i % PROGRESS_COLORS.length];
                                    return (
                                        <div className="progress-group" key={cohort.id}>
                                            <div className="progress-header">
                                                <span>{cohort.name}</span>
                                                <span className={`progress-value ${color}`}>{cohort.progress}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className={`progress-fill ${color}`} style={{ width: `${cohort.progress}%` }}></div>
                                            </div>
                                            <div className="progress-meta">
                                                {cohort.completed_tasks}/{cohort.total_tasks} tasks completed
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {/* ── Upcoming Deadlines (LIVE) ── */}
                        {deadlines.length > 0 && (
                            <div className="upcoming-deadlines">
                                <div className="admin-card-title">Upcoming Deadlines</div>
                                <div className="deadline-list">
                                    {deadlines.map(dl => {
                                        const days = Math.ceil((new Date(dl.due_date).getTime() - Date.now()) / 86400000);
                                        const color = days <= 2 ? 'red' : days <= 7 ? 'yellow' : 'green';
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
