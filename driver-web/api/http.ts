import axios from 'axios';

export const DRIVER_TOKEN_KEY = 'driver_access_token';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6100/api',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(DRIVER_TOKEN_KEY);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) return message.join(', ');

    return message || error.message || 'Có lỗi xảy ra';
  }

  if (error instanceof Error) return error.message;

  return 'Có lỗi xảy ra';
}

export function getDriverToken() {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem(DRIVER_TOKEN_KEY);
}

export function setDriverToken(token: string) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(DRIVER_TOKEN_KEY, token);
}

export function clearDriverToken() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(DRIVER_TOKEN_KEY);
}