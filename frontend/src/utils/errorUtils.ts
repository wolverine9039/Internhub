import { AxiosError } from 'axios';

interface ApiErrorData {
  error?: string | { message?: string };
  message?: string;
}

/**
 * Extracts a user-friendly error message from an Axios error or generic Error.
 * Replaces unsafe `catch (err: any)` patterns throughout the codebase.
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorData | undefined;
    if (data?.error) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.error === 'object' && data.error.message) return data.error.message;
    }
    if (data?.message) return data.message;
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/** Type guard for Badge variant values */
export type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'gray';
