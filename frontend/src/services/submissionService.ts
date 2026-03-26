import api from './api';
import type { Submission, PaginatedResponse } from '@/types';

export interface SubmissionQueryParams {
  page?: number;
  page_size?: number;
  task_id?: number;
  intern_id?: number;
  status?: string;
}

export interface CreateSubmissionPayload {
  task_id: number;
  intern_id: number;
  github_url: string;
  demo_url?: string;
  file_url?: string;
  notes?: string;
}

export const submissionService = {
  getSubmissions: async (params?: SubmissionQueryParams): Promise<PaginatedResponse<Submission>> => {
    const res = await api.get('/submissions', { params });
    return res.data;
  },

  createSubmission: async (data: CreateSubmissionPayload): Promise<{ message: string; submissionId: number }> => {
    const res = await api.post('/submissions', data);
    return res.data;
  },

  updateSubmissionStatus: async (id: number, status: 'reviewed' | 'revision_requested', feedback?: string): Promise<Submission> => {
    const res = await api.patch(`/submissions/${id}`, { status, notes: feedback });
    return res.data;
  },

  deleteSubmission: async (id: number): Promise<void> => {
    await api.delete(`/submissions/${id}`);
  }
};
