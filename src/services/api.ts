import { API_BASE_URL } from '@/constants/api';
import type { ApiResult } from '@/types';

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data: T = await response.json();
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
};
