import api from './api';
import type { Project, PaginatedResponse } from '@/types';

export interface ProjectQueryParams {
  page?: number;
  page_size?: number;
  sort?: string;
  cohort_id?: number;
  trainer_id?: number;
  search?: string;
}

export interface ProjectPayload {
  title: string;
  description?: string;
  cohort_id: number;
  trainer_id?: number;
}

export const projectService = {
  getProjects: (params?: ProjectQueryParams) =>
    api.get<PaginatedResponse<Project>>('/projects', { params }).then(r => r.data),

  getProjectById: (id: number) =>
    api.get<Project>(`/projects/${id}`).then(r => r.data),

  createProject: (data: ProjectPayload) =>
    api.post('/projects', data).then(r => r.data),

  updateProject: (id: number, data: Partial<ProjectPayload>) =>
    api.patch<Project>(`/projects/${id}`, data).then(r => r.data),

  deleteProject: (id: number) =>
    api.delete(`/projects/${id}`).then(r => r.data),
};
