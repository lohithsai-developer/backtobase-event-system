// Direct production backend URL on Render
const DEFAULT_CLOUD_API = 'https://backtobase-event-system.onrender.com/api';

export const getApiBase = (): string => {
  // If running on local development Vite server (localhost:5173), proxy through /api
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return '/api';
  }

  let base = DEFAULT_CLOUD_API;

  // 1. Vite environment variable if explicitly configured
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    base = envUrl.trim();
  } else {
    // 2. Custom override from localStorage (if any)
    const custom = typeof window !== 'undefined' ? localStorage.getItem('btb_backend_url') : null;
    if (custom && custom.trim()) {
      base = custom.trim();
    }
  }

  base = base.replace(/\/+$/, '');

  // Auto-correct: ensure backend URL always has /api prefix for endpoints
  if (base.startsWith('http') && !base.endsWith('/api') && !base.includes('/api/')) {
    base = `${base}/api`;
    // Update stored URL if it was missing /api
    if (typeof window !== 'undefined') {
      localStorage.setItem('btb_backend_url', base);
    }
  }

  return base;
};

export const setCustomApiBase = (url: string): void => {
  if (!url || !url.trim()) {
    localStorage.removeItem('btb_backend_url');
  } else {
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api') && !clean.includes('/api/')) {
      clean = `${clean}/api`;
    }
    localStorage.setItem('btb_backend_url', clean);
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('btb_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('btb_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('btb_token');
  localStorage.removeItem('btb_user');
};

export const getStoredUser = () => {
  const data = localStorage.getItem('btb_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: any) => {
  localStorage.setItem('btb_user', JSON.stringify(user));
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const apiBase = getApiBase();
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(
      `Cannot connect to backend server at ${apiBase}. Ensure backend is running or configure backend URL.`
    );
  }

  if (response.status === 405) {
    throw new Error(
      `HTTP 405: Backend API route not reached at ${apiBase}. If running on Vercel, click "Configure Backend API URL" below to point to your Render backend.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error ${response.status}`);
    }
    return data;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error ${response.status}`);
  }

  return (await response.text()) as unknown as T;
}
