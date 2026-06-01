import { AuthUser } from "@/types/auth.types";

export function saveAuthData(params: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  localStorage.setItem('accessToken', params.accessToken);
  localStorage.setItem('refreshToken', params.refreshToken);
  localStorage.setItem('user', JSON.stringify(params.user));
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem('accessToken');
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem('refreshToken');
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const rawUser = localStorage.getItem('user');

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthData() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}