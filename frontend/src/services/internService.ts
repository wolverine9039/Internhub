import api from './api';

export interface InternTrainer {
  id: number;
  name: string;
  email: string;
}

export interface InternProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  cohort_id: number | null;
  cohort_name: string | null;
  cohort_status: string | null;
  cohort_start: string | null;
  cohort_end: string | null;
  trainers: InternTrainer[];
  created_at: string;
}

export const internService = {
  getProfile: () =>
    api.get<InternProfile>('/intern/profile').then(r => r.data),
};
