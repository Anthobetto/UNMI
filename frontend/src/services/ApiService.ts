/**
 * ApiService - Centralized HTTP client
 * Handles all API requests with consistent error handling
 */

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

export class ApiServiceError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiServiceError';
  }
}

/**
 * API Service - Abstracción HTTP con error handling
 */
export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper: Get auth token
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Helper: Build headers
   */
  private buildHeaders(contentType: string = 'application/json'): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': contentType,
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Helper: Handle response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiServiceError(
        errorData.message || `HTTP Error ${response.status}`,
        response.status,
        errorData.code
      );
    }

    // 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload file (multipart/form-data)
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Singleton instance
export const apiService = new ApiService('/api');

// ==========================================
// Legacy helper (MVP compatibility)
// ==========================================
export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('accessToken');

  const headers: HeadersInit = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Fetch helper that returns JSON typed
 */
export async function fetchJsonWithAuth<T>(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(input, init);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiServiceError(
      error.message || `HTTP Error ${response.status}`,
      response.status,
      error.code
    );
  }

  return response.json() as Promise<T>;
}
