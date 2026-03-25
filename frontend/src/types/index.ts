// ─── User Roles ───
export enum UserRole {
  ADMIN = 'admin',
  TRAINER = 'trainer',
  INTERN = 'intern',
}

// ─── User (matches DB columns) ───
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  cohort_id?: number | null;
  is_active: boolean;
  created_at: string;
}

// ─── Auth ───
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

// ─── Paginated Response ───
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

// ─── Cohort ───
export interface Cohort {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

// ─── Project ───
export interface Project {
  id: number;
  title: string;
  description: string | null;
  cohort_id: number;
  trainer_id: number | null;
  created_at: string;
}

// ─── Task ───
export interface Task {
  id: number;
  title: string;
  description: string | null;
  project_id: number;
  assigned_to: number;
  created_by: number | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'submitted';
  created_at: string;
  assigned_to_name?: string;
  project_title?: string;
}

// ─── Submission ───
export interface Submission {
  id: number;
  task_id: number;
  intern_id: number;
  attempt_no: number;
  github_url: string;
  demo_url?: string;
  file_url?: string;
  notes?: string;
  status: 'pending' | 'submitted' | 'reviewed' | 'revision_requested';
  submitted_at: string;
  reviewed_at?: string;
  updated_at: string;
  task_title?: string;
  intern_name?: string;
}

// ─── Evaluation ───
export interface Evaluation {
  id: number;
  submission_id: number;
  trainer_id: number;
  code_quality: number | null;
  functionality: number | null;
  documentation: number | null;
  timeliness: number | null;
  score: number | null;
  feedback?: string;
  strengths?: string;
  improvements?: string;
  evaluated_at: string;
  updated_at: string;
}

// ─── Dashboard Stats ───
export interface DashboardStats {
  totalInterns: number;
  activeProjects: number;
  pendingSubmissions: number;
  evaluationsDue: number;
}
