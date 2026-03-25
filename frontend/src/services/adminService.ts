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

export const adminService = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/admin/stats').then(r => r.data),

  getRecentActivity: () =>
    api.get<ActivityItem[]>('/admin/recent-activity').then(r => r.data),

  getCohortProgress: () =>
    api.get<CohortProgress[]>('/admin/cohort-progress').then(r => r.data),

  getUpcomingDeadlines: () =>
    api.get<UpcomingDeadline[]>('/admin/upcoming-deadlines').then(r => r.data),

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
