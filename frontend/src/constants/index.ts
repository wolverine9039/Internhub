// ─── API ───
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ─── Local Storage Keys ───
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;

// ─── Route Paths ───
export const ROUTES = {
  LOGIN: '/',
  ADMIN: '/admin',
  TRAINER: '/trainer',
  INTERN: '/intern',
} as const;

// ─── Role Labels ───
export const ROLE_LABELS = {
  admin: 'Administrator',
  trainer: 'Trainer',
  intern: 'Intern',
} as const;
