// src/lib/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
}
