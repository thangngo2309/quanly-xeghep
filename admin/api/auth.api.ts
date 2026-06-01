import { AuthResponse, RefreshTokenPayload, SigninPayload } from '@/types/auth.types';
import { http } from './http';

export async function signinApi(payload: SigninPayload) {
  const response = await http.post<AuthResponse>('/auth/signin', payload);

  return response.data;
}

export async function signupApi(payload: {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}) {
  const response = await http.post<AuthResponse>('/auth/signup', payload);

  return response.data;
}

export async function refreshTokenApi(payload: RefreshTokenPayload) {
  const response = await http.post<AuthResponse>('/auth/refresh', payload);

  return response.data;
}

export async function signoutApi() {
  const response = await http.post<{ message: string }>('/auth/signout');

  return response.data;
}

export async function getMeApi() {
  const response = await http.get<AuthResponse['user']>('/users/me');

  return response.data;
}