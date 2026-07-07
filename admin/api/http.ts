import {
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  saveAuthData,
} from '@/helper/auth-storage';
import type {
  AuthResponse,
  JwtPayload,
} from '@/types/auth.types';
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

/**
 * Không đặt Content-Type mặc định tại đây.
 *
 * Axios sẽ tự xác định:
 * - Object thông thường: application/json
 * - FormData: multipart/form-data kèm boundary
 */
export const http = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
});

/**
 * Instance riêng để gọi refresh token.
 * Không dùng http để tránh vòng lặp interceptor.
 */
const refreshHttp = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryAxiosRequestConfig =
  InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

let refreshPromise: Promise<AuthResponse> | null =
  null;

function redirectToLogin() {
  clearAuthData();

  if (typeof window !== 'undefined') {
    window.location.href =
      '/xeghep/admin/login';
  }
}

function parseJwt(
  token: string,
): JwtPayload | null {
  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const normalizedBase64 = base64.padEnd(
      base64.length +
        ((4 - (base64.length % 4)) % 4),
      '=',
    );

    const jsonPayload = decodeURIComponent(
      atob(normalizedBase64)
        .split('')
        .map((char) => {
          const charCode = char
            .charCodeAt(0)
            .toString(16);

          return `%${`00${charCode}`.slice(
            -2,
          )}`;
        })
        .join(''),
    );

    return JSON.parse(
      jsonPayload,
    ) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(
  token: string,
  offsetSeconds = 30,
) {
  const payload = parseJwt(token);

  if (!payload?.exp) {
    return true;
  }

  const now = Math.floor(
    Date.now() / 1000,
  );

  return (
    payload.exp <= now + offsetSeconds
  );
}

function isAuthEndpoint(url?: string) {
  if (!url) {
    return false;
  }

  return (
    url.includes('/auth/signin') ||
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh')
  );
}

function isFormData(
  value: unknown,
): value is FormData {
  return (
    typeof FormData !== 'undefined' &&
    value instanceof FormData
  );
}

/**
 * Với FormData phải xóa Content-Type để browser tự sinh:
 *
 * multipart/form-data;
 * boundary=----WebKitFormBoundary...
 */
function removeContentTypeHeader(
  config: InternalAxiosRequestConfig,
) {
  config.headers.delete('Content-Type');
  config.headers.delete('content-type');
}

function setAuthorizationHeader(
  config: InternalAxiosRequestConfig,
  accessToken: string,
) {
  config.headers.set(
    'Authorization',
    `Bearer ${accessToken}`,
  );
}

async function refreshAccessToken() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    redirectToLogin();

    throw new Error(
      'Refresh token không tồn tại',
    );
  }

  if (
    isTokenExpired(refreshToken, 0)
  ) {
    redirectToLogin();

    throw new Error(
      'Refresh token đã hết hạn',
    );
  }

  if (!refreshPromise) {
    refreshPromise = refreshHttp
      .post<AuthResponse>(
        '/auth/refresh',
        {
          refreshToken,
        },
      )
      .then((response) => {
        const data = response.data;

        saveAuthData({
          user: data.user,
          accessToken:
            data.accessToken,
          refreshToken:
            data.refreshToken,
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

http.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ) => {
    /**
     * Phải xử lý FormData trước khi gửi request.
     * Không để application/json tồn tại trên request upload.
     */
    if (isFormData(config.data)) {
      removeContentTypeHeader(config);
    }

    if (
      typeof window === 'undefined'
    ) {
      return config;
    }

    if (
      isAuthEndpoint(config.url)
    ) {
      return config;
    }

    const accessToken =
      getAccessToken();

    if (!accessToken) {
      return config;
    }

    if (
      isTokenExpired(accessToken)
    ) {
      const data =
        await refreshAccessToken();

      setAuthorizationHeader(
        config,
        data.accessToken,
      );

      return config;
    }

    setAuthorizationHeader(
      config,
      accessToken,
    );

    return config;
  },
  (error) =>
    Promise.reject(error),
);

http.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | RetryAxiosRequestConfig
        | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status =
      error.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(
        originalRequest.url,
      )
    ) {
      originalRequest._retry = true;

      try {
        const data =
          await refreshAccessToken();

        setAuthorizationHeader(
          originalRequest,
          data.accessToken,
        );

        /**
         * Nếu request ban đầu là FormData,
         * tiếp tục xóa Content-Type khi retry
         * để Axios tự sinh boundary mới.
         */
        if (
          isFormData(
            originalRequest.data,
          )
        ) {
          removeContentTypeHeader(
            originalRequest,
          );
        }

        return http(
          originalRequest as AxiosRequestConfig,
        );
      } catch (refreshError) {
        return Promise.reject(
          refreshError,
        );
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(
  error: unknown,
) {
  if (axios.isAxiosError(error)) {
    const status =
      error.response?.status;

    const responseData =
      error.response?.data as
        | {
            message?: unknown;
            error?: unknown;
          }
        | undefined;

    const message =
      responseData?.message;

    if (status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }

    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }

    if (status === 413) {
      return 'File tải lên vượt quá dung lượng cho phép.';
    }

    if (Array.isArray(message)) {
      const firstMessage =
        message.find(
          (item) =>
            typeof item === 'string',
        );

      if (
        typeof firstMessage ===
        'string'
      ) {
        return firstMessage;
      }
    }

    if (
      typeof message === 'string'
    ) {
      return message;
    }

    if (
      typeof responseData?.error ===
      'string'
    ) {
      return responseData.error;
    }

    if (
      error.code ===
      'ECONNABORTED'
    ) {
      return 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.';
    }

    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.';
    }
  }

  if (error instanceof Error) {
    return (
      error.message ||
      'Có lỗi xảy ra. Vui lòng thử lại.'
    );
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export function cleanParams<
  T extends Record<string, unknown>,
>(params: T) {
  const cleaned: Record<
    string,
    unknown
  > = {};

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ''
      ) {
        return;
      }

      cleaned[key] = value;
    },
  );

  return cleaned;
}