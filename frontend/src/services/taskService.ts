import api from './api';
import type { Task, PaginatedResponse } from '@/types';

export interface TaskQueryParams {
  page?: number;
  page_size?: number;
  sort?: string;
  assigned_to?: number;
  project_id?: number;
  status?: string;
  priority?: string;
  search?: string;
}

export interface TaskPayload {
  title: string;
  description?: string;
  project_id: number;
  assigned_to: number;
  created_by?: number;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
}

export const taskService = {
  getTasks: (params?: TaskQueryParams) =>
    api.get<PaginatedResponse<Task>>('/tasks', { params }).then(r => r.data),

  getTaskById: (id: number) =>
    api.get<Task>(`/tasks/${id}`).then(r => r.data),

  createTask: (data: TaskPayload) =>
    api.post('/tasks', data).then(r => r.data),

  updateTask: (id: number, data: Partial<TaskPayload & { status: string }>) =>
    api.patch<Task>(`/tasks/${id}`, data).then(r => r.data),

  deleteTask: (id: number) =>
    api.delete(`/tasks/${id}`).then(r => r.data),
};
