/**
 * Django REST Framework (DRF) Types & API Response Models
 */

export interface DRFTokenResponse {
  access: string;
  refresh: string;
  user?: AuthUserProfile;
}

export interface AuthUserProfile {
  id: string | number;
  email: string;
  name?: string;
  full_name?: string;
  role: string;
  department?: string;
  avatar?: string;
  is_staff?: boolean;
}

export interface DRFPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DRFErrorDetail {
  [key: string]: string | string[] | DRFErrorDetail;
}

export interface APIErrorResponse {
  message: string;
  status?: number;
  fieldErrors?: Record<string, string[]>;
  isNetworkError?: boolean;
}
