import api from './api';
import type { Evaluation, PaginatedResponse } from '@/types';

export interface EvaluationQueryParams {
  page?: number;
  page_size?: number;
  submission_id?: number;
  trainer_id?: number;
}

export const evaluationService = {
  getEvaluations: async (params?: EvaluationQueryParams): Promise<PaginatedResponse<Evaluation>> => {
    const res = await api.get('/evaluations', { params });
    return res.data;
  },

  createEvaluation: async (data: any): Promise<Evaluation> => {
    const res = await api.post('/evaluations', data);
    return res.data;
  },

  updateEvaluation: async (id: number, data: any): Promise<Evaluation> => {
    const res = await api.put(`/evaluations/${id}`, data);
    return res.data;
  },

  deleteEvaluation: async (id: number): Promise<void> => {
    await api.delete(`/evaluations/${id}`);
  }
};
