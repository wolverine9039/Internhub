import api from './api';
import type { Submission, Evaluation } from '@/types';

// ── Trainer Dashboard Types ──

export interface TrainerStats {
  pendingReviews: number;
  totalEvaluated: number;
  avgScore: number;
  internCount: number;
}

export interface TrainerIntern {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  cohort_name: string | null;
  total_tasks: number;
  completed_tasks: number;
  avg_score: number | null;
}

export interface TrainerDeadline {
  id: number;
  title: string;
  due_date: string;
  status: string;
  project_title: string;
  assigned_to_name: string;
}

export interface TrainerEvaluation extends Evaluation {
  task_title?: string;
  intern_name?: string;
}

export interface EvaluationPayload {
  submission_id: number;
  trainer_id: number;
  code_quality: number;
  functionality: number;
  documentation: number;
  timeliness: number;
  score: number;
  strengths: string;
  improvements: string;
  feedback?: string;
}

// ── Service ──

export const trainerService = {
  getStats: () =>
    api.get<TrainerStats>('/trainer/stats').then(r => r.data),

  getMyInterns: () =>
    api.get<TrainerIntern[]>('/trainer/my-interns').then(r => r.data),

  getMySubmissions: (status?: string, search?: string) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (search) params.search = search;
    return api.get<Submission[]>('/trainer/my-submissions', { params }).then(r => r.data);
  },

  getMyEvaluations: () =>
    api.get<TrainerEvaluation[]>('/trainer/my-evaluations').then(r => r.data),

  getUpcomingDeadlines: () =>
    api.get<TrainerDeadline[]>('/trainer/upcoming-deadlines').then(r => r.data),

  submitEvaluation: (data: EvaluationPayload) =>
    api.post('/evaluations', data).then(r => r.data),

  updateEvaluation: (id: number, data: EvaluationPayload) =>
    api.put(`/evaluations/${id}`, data).then(r => r.data),

  updateSubmissionStatus: (id: number, status: string, notes?: string) =>
    api.patch(`/submissions/${id}`, { status, ...(notes !== undefined ? { notes } : {}) }).then(r => r.data),
};
