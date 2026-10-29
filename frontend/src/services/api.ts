const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

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
