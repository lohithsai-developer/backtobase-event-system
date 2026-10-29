export const getApiBase = (): string => {
  const custom = localStorage.getItem('btb_backend_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '/api';
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
