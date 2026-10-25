/**
 * Zentry POS - Servicio API REST
 * Cliente HTTP agnóstico para conectar React con el backend de Laravel v1.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'inventory';
  status: 'active' | 'inactive';
  avatar?: string;
  phone?: string;
}

export interface Company {
  id: number;
  name: string;
  tax_id: string;
  currency: string;
  default_tax_rate: number | string;
  invoice_prefix: string;
}

export interface AuthData {
  token: string;
  token_type: string;
  user: User;
  company: Company | null;
}

export const tokenStorage = {
  get: (): string | null => localStorage.getItem('zentry_token'),
  set: (token: string): void => localStorage.setItem('zentry_token', token),
  clear: (): void => {
    localStorage.removeItem('zentry_token');
    localStorage.removeItem('zentry_user');
    localStorage.removeItem('zentry_company');
  },
  getUser: (): User | null => {
    const raw = localStorage.getItem('zentry_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: User): void => localStorage.setItem('zentry_user', JSON.stringify(user)),
  getCompany: (): Company | null => {
    const raw = localStorage.getItem('zentry_company');
    return raw ? JSON.parse(raw) : null;
  },
  setCompany: (company: Company): void => localStorage.setItem('zentry_company', JSON.stringify(company)),
};

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || `Error del servidor (${response.status})`;
    const error: any = new Error(message);
    error.status = response.status;
    error.errors = data?.errors;
    throw error;
  }

  return data;
}

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthData>> => {
    const res = await apiFetch<ApiResponse<AuthData>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.data?.token) {
      tokenStorage.set(res.data.token);
      if (res.data.user) tokenStorage.setUser(res.data.user);
      if (res.data.company) tokenStorage.setCompany(res.data.company);
    }

    return res;
  },

  me: async (): Promise<ApiResponse<{ user: User; company: Company | null }>> => {
    return apiFetch<ApiResponse<{ user: User; company: Company | null }>>('/auth/me');
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      return await apiFetch<ApiResponse<null>>('/auth/logout', { method: 'POST' });
    } finally {
      tokenStorage.clear();
    }
  },
};

export const systemApi = {
  health: async (): Promise<{ status: string; app: string; database: string }> => {
    return apiFetch('/health');
  },
};
