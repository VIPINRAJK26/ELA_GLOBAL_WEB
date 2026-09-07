/**
 * Centralized Django REST Framework (DRF) API Client
 * - Manages JWT Bearer authentication headers
 * - Automatic 401 token refresh interceptor
 * - Parses standard DRF validation errors
 * - Provides graceful fallback when backend server is offline
 */

import { APIErrorResponse, DRFTokenResponse } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ilas_access_token',
  REFRESH_TOKEN: 'ilas_refresh_token',
  AUTH_ROLE: 'ilas_auth_role',
  USER_NAME: 'ilas_user_name',
  USER_EMAIL: 'ilas_user_email',
  USER_ID: 'ilas_user_id',
};

// Token helpers
export const getAccessToken = (): string | null => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
export const getRefreshToken = (): string | null => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

export const setTokens = (tokens: { access?: string; refresh?: string }) => {
  if (tokens.access) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
  if (tokens.refresh) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Format DRF error responses into friendly string messages and structured field errors
 */
export const parseDRFError = (data: any, status?: number): APIErrorResponse => {
  if (!data || typeof data !== 'object') {
    return {
      message: status ? `Server returned error (${status})` : 'An unexpected error occurred.',
      status,
    };
  }

  // Handle standard DRF detail / error message
  if (typeof data.detail === 'string') {
    return { message: data.detail, status };
  }
  if (typeof data.error === 'string') {
    return { message: data.error, status };
  }
  if (typeof data.message === 'string') {
    return { message: data.message, status };
  }

  // Handle non_field_errors
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return { message: data.non_field_errors.join(' '), status };
  }

  // Handle dictionary of field errors (e.g. { email: ["Enter a valid email."], password: ["Too short"] })
  const fieldErrors: Record<string, string[]> = {};
  const messageParts: string[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      fieldErrors[key] = val.map(String);
      messageParts.push(`${key}: ${val.join(', ')}`);
    } else if (typeof val === 'string') {
      fieldErrors[key] = [val];
      messageParts.push(`${key}: ${val}`);
    }
  }

  if (messageParts.length > 0) {
    return {
      message: messageParts.join(' | '),
      fieldErrors,
      status,
    };
  }

  return {
    message: 'Operation could not be completed.',
    status,
  };
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

/**
 * Core Request Method for DRF
 */
export async function drfFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<{ data: T | null; error: APIErrorResponse | null }> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Attempt token refresh on 401 Unauthorized if refresh token exists
    if (response.status === 401 && !isRetry) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshData: DRFTokenResponse = await refreshRes.json();
              setTokens({ access: refreshData.access });
              isRefreshing = false;
              onTokenRefreshed(refreshData.access);
              return drfFetch<T>(endpoint, options, true);
            } else {
              isRefreshing = false;
              clearTokens();
              window.dispatchEvent(new CustomEvent('ilas-auth-state-changed'));
            }
          } catch {
            isRefreshing = false;
            clearTokens();
          }
        } else {
          // Wait for current refresh to complete
          return new Promise((resolve) => {
            refreshSubscribers.push((newToken) => {
              options.headers = {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
              };
              resolve(drfFetch<T>(endpoint, options, true));
            });
          });
        }
      }
    }

    // Parse JSON body if present
    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      if (text) {
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = { message: text };
        }
      }
    }

    if (!response.ok) {
      const errorInfo = parseDRFError(responseData, response.status);
      return { data: null, error: errorInfo };
    }

    return { data: responseData as T, error: null };
  } catch (networkError: any) {
    // Network errors (e.g. Django backend server not running yet or CORS error)
    const isConnRefused =
      networkError?.message?.includes('fetch') ||
      networkError?.message?.includes('NetworkError') ||
      networkError?.name === 'TypeError';

    return {
      data: null,
      error: {
        message: isConnRefused
          ? 'Django REST backend is currently unreachable (server offline or connection refused).'
          : (networkError?.message || 'Network request failed'),
        isNetworkError: true,
      },
    };
  }
}

/**
 * Standard HTTP helper methods
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    drfFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    drfFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    drfFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    drfFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    drfFetch<T>(endpoint, { ...options, method: 'DELETE' }),

  getBaseUrl: () => API_BASE_URL,
};
