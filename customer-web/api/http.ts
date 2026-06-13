import axios from 'axios';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6100/api',
  timeout: 15000,
});

export function cleanParams<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== '';
    }),
  );
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) return message.join(', ');

    return message || error.message || 'Có lỗi xảy ra';
  }

  if (error instanceof Error) return error.message;

  return 'Có lỗi xảy ra';
}