import api from './api';
import type { Cohort, PaginatedResponse } from '@/types';

export interface CohortQueryParams {
  page?: number;
  page_size?: number;
  sort?: string;
  search?: string;
}

export interface CohortPayload {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export const cohortService = {
  getCohorts: (params?: CohortQueryParams) =>
    api.get<PaginatedResponse<Cohort>>('/cohorts', { params }).then(r => r.data),

  getCohortById: (id: number) =>
    api.get<Cohort>(`/cohorts/${id}`).then(r => r.data),

  createCohort: (data: CohortPayload) =>
    api.post('/cohorts', data).then(r => r.data),

  updateCohort: (id: number, data: Partial<CohortPayload>) =>
    api.patch<Cohort>(`/cohorts/${id}`, data).then(r => r.data),

  deleteCohort: (id: number) =>
    api.delete(`/cohorts/${id}`).then(r => r.data),
};
