export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAccessToken() {
  return localStorage.getItem('access_token');
}

function getRefreshToken() {
  return localStorage.getItem('refresh_token');
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem('refresh_token', token);
  } else {
    localStorage.removeItem('refresh_token');
  }
}

export function clearAuthStorage() {
  setAccessToken(null);
  setRefreshToken(null);
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* Non-JSON body: payload stays null */
  }
  if (!response.ok) {
    clearAuthStorage();
    throw new ApiError(
      payload?.error?.message || response.statusText || 'Token refresh failed',
      response.status,
      payload
    );
  }
  setAccessToken(payload.token);
  setRefreshToken(payload.refreshToken);
  return payload.token;
}

const AUTH_PATHS = ['/auth/tenant/login', '/auth/platform/login', '/auth/refresh'];

async function apiRequest(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* Non-JSON body: payload stays null */
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || response.statusText || 'Request failed';

    if (response.status === 401) {
      const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));
      const isRetry = options.__retry === true;

      if (isAuthPath || isRetry || !getRefreshToken()) {
        clearAuthStorage();
        throw new ApiError(message, response.status, payload);
      }

      try {
        const newToken = await (refreshPromise ||=
          refreshAccessToken().finally(() => {
            refreshPromise = null;
          }));
        return apiRequest(path, { ...options, __retry: true });
      } catch (refreshErr) {
        clearAuthStorage();
        const loginPath = path.startsWith('/platform')
          ? '/platform/login'
          : '/login';
        window.location.assign(loginPath);
        throw refreshErr instanceof ApiError
          ? refreshErr
          : new ApiError(
              refreshErr.message || 'Session expired. Please sign in again.',
              401,
              null
            );
      }
    }

    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body, options) =>
    apiRequest(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  put: (path, body, options) =>
    apiRequest(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (path, options) =>
    apiRequest(path, { ...options, method: 'DELETE' }),
};