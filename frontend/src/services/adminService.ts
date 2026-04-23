import api from './api';
import type { DashboardStats } from '@/types';

export interface ActivityItem {
  id: number;
  user_name: string;
  task_title: string;
  timestamp: string;
  type: 'submission' | 'evaluation' | 'task_assigned' | 'user_joined';
}

export interface CohortProgress {
  id: number;
  name: string;
  description: string | null;
  total_tasks: number;
  completed_tasks: number;
  progress: number;
  start_date: string | null;
  end_date: string | null;
}

export interface UpcomingDeadline {
  id: number;
  title: string;
  due_date: string;
  status: string;
  project_title: string;
}

// ── Analytics Types ──

export interface AnalyticsKPIs {
  taskCompletionRate: number;
  avgEvaluationScore: number;
  totalEvaluations: number;
  submissionRate: number;
  activeInternCount: number;
  totalInternCount: number;
}

export interface TaskStatusItem {
  status: string;
  count: number;
}

export interface ScoreDistItem {
  range: string;
  count: number;
}

export interface ScoreDimensions {
  code_quality: number;
  functionality: number;
  documentation: number;
  timeliness: number;
}

export interface CohortPerformanceItem {
  id: number;
  name: string;
  status: string;
  internCount: number;
  totalTasks: number;
  completedTasks: number;
  taskProgress: number;
  avgScore: number;
}

export interface LeaderboardIntern {
  rank: number;
  id: number;
  name: string;
  cohort: string;
  avgScore: number;
  tasksCompleted: number;
  submissions: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKPIs;
  taskStatusBreakdown: TaskStatusItem[];
  scoreDistribution: ScoreDistItem[];
  scoreDimensions: ScoreDimensions;
  cohortPerformance: CohortPerformanceItem[];
  topInterns: LeaderboardIntern[];
}

export interface AnalyticsFilters {
  from?: string;
  to?: string;
}

export const adminService = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/admin/stats').then(r => r.data),

  getRecentActivity: () =>
    api.get<ActivityItem[]>('/admin/recent-activity').then(r => r.data),

  getCohortProgress: () =>
    api.get<CohortProgress[]>('/admin/cohort-progress').then(r => r.data),

  getUpcomingDeadlines: () =>
    api.get<UpcomingDeadline[]>('/admin/upcoming-deadlines').then(r => r.data),

  getAnalytics: (filters?: AnalyticsFilters) =>
    api.get<AnalyticsData>('/admin/analytics', { params: filters }).then(r => r.data),

  exportData: async (resource: 'users' | 'tasks' | 'submissions' | 'evaluations') => {
    const res = await api.get(`/admin/export/${resource}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${resource}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

