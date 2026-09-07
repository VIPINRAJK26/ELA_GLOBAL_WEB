/**
 * Django REST Framework Authentication Service
 * Endpoints:
 * - POST /auth/login/ (or /auth/token/) -> { access, refresh, user }
 * - POST /auth/register/ -> { access, refresh, user }
 * - POST /auth/logout/ -> { detail }
 * - GET  /auth/me/ -> user profile
 * - POST /auth/change-password/ -> { detail }
 */

import { apiClient, setTokens, clearTokens, STORAGE_KEYS, getAccessToken } from './client';
import { AuthUserProfile, DRFTokenResponse } from './types';

export interface LoginPayload {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: string;
  department?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  old_password?: string;
  new_password: string;
}

export const authService = {
  /**
   * Log in user via Django REST Framework (JWT or Token Auth)
   */
  login: async (credentials: LoginPayload) => {
    const { data, error } = await apiClient.post<DRFTokenResponse | { token: string; user?: AuthUserProfile }>(
      '/auth/login/',
      credentials
    );

    if (error) {
      return { data: null, error };
    }

    if (data) {
      // Handle SimpleJWT response ({ access, refresh, user })
      if ('access' in data && data.access) {
        setTokens({ access: data.access, refresh: data.refresh });
      } else if ('token' in data && data.token) {
        // Handle DRF standard TokenAuth response ({ token })
        setTokens({ access: data.token });
      }

      const user = data.user;
      if (user) {
        if (user.role) localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, user.role);
        if (user.name || user.full_name) localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name || user.full_name || '');
        if (user.email) localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
        if (user.id) localStorage.setItem(STORAGE_KEYS.USER_ID, String(user.id));
      }

      window.dispatchEvent(new CustomEvent('ilas-auth-state-changed'));
    }

    return { data, error: null };
  },

  /**
   * Register a new user via Django REST Framework
   */
  register: async (userData: RegisterPayload) => {
    const { data, error } = await apiClient.post<DRFTokenResponse | AuthUserProfile>(
      '/auth/register/',
      userData
    );

    if (error) {
      return { data: null, error };
    }

    if (data) {
      if ('access' in data && data.access) {
        setTokens({ access: data.access, refresh: data.refresh });
      }
      const user = 'user' in data && data.user ? data.user : (data as AuthUserProfile);
      if (user) {
        if (user.role) localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, user.role);
        if (user.name || user.full_name) localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name || user.full_name || '');
        if (user.email) localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
      }
      window.dispatchEvent(new CustomEvent('ilas-auth-state-changed'));
    }

    return { data, error: null };
  },

  /**
   * Fetch authenticated user's profile from DRF
   */
  getCurrentUser: async () => {
    return apiClient.get<AuthUserProfile>('/auth/me/');
  },

  /**
   * Change user password via DRF
   */
  changePassword: async (payload: ChangePasswordPayload) => {
    return apiClient.post<{ message: string; detail?: string }>('/auth/change-password/', payload);
  },

  /**
   * Logout: Invalidate session on server (optional token blacklist) and clear local credentials
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch {
      // Continue local cleanup even if network fails
    } finally {
      clearTokens();
      localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
      localStorage.removeItem(STORAGE_KEYS.USER_NAME);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      window.dispatchEvent(new CustomEvent('ilas-auth-state-changed'));
    }
  },

  /**
   * Check whether an access token exists locally
   */
  isAuthenticated: (): boolean => {
    return !!getAccessToken();
  },
};
