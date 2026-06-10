import { clearAuthData, getAccessToken, getRefreshToken, saveAuthData } from '@/helper/auth-storage';
import { AuthResponse, JwtPayload } from '@/types/auth.types';
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const http = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Dùng instance riêng để gọi refresh token.
 * Không dùng http ở đây để tránh vòng lặp interceptor.
 */
const refreshHttp = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<AuthResponse> | null = null;

function redirectToLogin() {
  clearAuthData();

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');

    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => {
          return `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`;
        })
        .join(''),
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, offsetSeconds = 30) {
  const payload = parseJwt(token);

  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);

  return payload.exp <= now + offsetSeconds;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    redirectToLogin();
    throw new Error('Refresh token không tồn tại');
  }

  if (isTokenExpired(refreshToken, 0)) {
    redirectToLogin();
    throw new Error('Refresh token đã hết hạn');
  }

  if (!refreshPromise) {
    refreshPromise = refreshHttp
      .post<AuthResponse>('/auth/refresh', {
        refreshToken,
      })
      .then((response) => {
        const data = response.data;

        saveAuthData({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        return data;
      })
      .catch((error) => {
        redirectToLogin();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function isAuthEndpoint(url?: string) {
  if (!url) return false;

  return (
    url.includes('/auth/signin') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh')
  );
}

http.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  if (isAuthEndpoint(config.url)) {
    return config;
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    return config;
  }

  if (isTokenExpired(accessToken)) {
    const data = await refreshAccessToken();

    config.headers.Authorization = `Bearer ${data.accessToken}`;

    return config;
  }

  config.headers.Authorization = `Bearer ${accessToken}`;

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const data = await refreshAccessToken();

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return http(originalRequest as AxiosRequestConfig);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (error.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }

    if (error.response?.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }

    if (Array.isArray(message)) {
      return message[0];
    }

    if (typeof message === 'string') {
      return message;
    }

  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export function cleanParams<T extends Record<string, any>>(params: T) {
  const cleaned: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    cleaned[key] = value;
  });

  return cleaned;
}