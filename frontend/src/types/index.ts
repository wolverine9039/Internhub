// ─── User Roles ───
export enum UserRole {
  ADMIN = 'admin',
  TRAINER = 'trainer',
  INTERN = 'intern',
}

// ─── User ───
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  cohortId?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ───
export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

// ─── Cohort ───
export interface Cohort {
  id: string;
  name: string;
  description: string;
  trainerId: string;
  status: 'active' | 'completed' | 'upcoming';
  startDate: string;
  endDate: string;
  progress: number;
}

// ─── Project ───
export interface Project {
  id: string;
  name: string;
  cohortId: string;
  totalTasks: number;
  completedTasks: number;
  submissions: number;
  deadline: string;
  status: 'planning' | 'in_progress' | 'at_risk' | 'completed';
}

// ─── Task ───
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'evaluated' | 'overdue';
  progress?: number;
}

// ─── Submission ───
export interface Submission {
  id: string;
  taskId: string;
  internId: string;
  repoUrl: string;
  demoUrl?: string;
  notes?: string;
  attachments?: string[];
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'revision_requested';
}

// ─── Evaluation ───
export interface Evaluation {
  id: string;
  submissionId: string;
  trainerId: string;
  codeQuality: number;
  functionality: number;
  documentation: number;
  timeliness: number;
  totalScore: number;
  strengths: string;
  improvements: string;
  evaluatedAt: string;
}
