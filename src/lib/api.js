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

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

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
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || response.statusText || 'Request failed';
    if (response.status === 401) {
      setAccessToken(null);
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