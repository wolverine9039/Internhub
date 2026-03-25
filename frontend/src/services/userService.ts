import api from './api';
import type { User, PaginatedResponse } from '@/types';

export interface UserQueryParams {
  page?: number;
  page_size?: number;
  sort?: string;
  role?: string;
  is_active?: string;
  search?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  cohort_id?: number | null;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  cohort_id?: number | null;
  is_active?: boolean;
}

export const userService = {
  getUsers: (params?: UserQueryParams) =>
    api.get<PaginatedResponse<User>>('/users', { params }).then(r => r.data),

  getUserById: (id: number) =>
    api.get<User>(`/users/${id}`).then(r => r.data),

  createUser: (data: CreateUserPayload) =>
    api.post('/users', data).then(r => r.data),

  updateUser: (id: number, data: UpdateUserPayload) =>
    api.patch<User>(`/users/${id}`, data).then(r => r.data),

  deleteUser: (id: number) =>
    api.delete(`/users/${id}`).then(r => r.data),
};
