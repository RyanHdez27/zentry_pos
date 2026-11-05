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
  role: 'superadmin' | 'admin' | 'cashier' | 'inventory';
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
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
  logo_path?: string | null;
  address?: string | null;
  modules?: string[] | null;
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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
      else localStorage.removeItem('zentry_company');
    }

    return res;
  },

  me: async (): Promise<ApiResponse<{ user: User; company: Company | null }>> => {
    return apiFetch<ApiResponse<{ user: User; company: Company | null }>>('/auth/me');
  },

  updateProfile: (data: FormData): Promise<ApiResponse<User>> => apiFetch('/auth/profile', { method: 'POST', body: data }),

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

export interface ManagedCompany extends Company {
  users_count?: number; products_count?: number; customers_count?: number;
  sales_count?: number; sales_total?: number; status: 'active' | 'suspended'; modules: string[];
}
export interface SuperAdminDashboard {
  summary: { companies: number; active_companies: number; users: number; products: number; sales: number; revenue: number };
  companies: ManagedCompany[];
}
export interface ManagedUser extends User { company_id: number; phone?: string; }
export const superAdminApi = {
  companies: (): Promise<ApiResponse<ManagedCompany[]>> => apiFetch('/companies'),
  dashboard: (): Promise<ApiResponse<SuperAdminDashboard>> => apiFetch('/superadmin/dashboard'),
  createCompany: (data: Record<string, unknown>): Promise<ApiResponse<ManagedCompany>> => apiFetch('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id: number, data: Record<string, unknown>): Promise<ApiResponse<ManagedCompany>> => apiFetch(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCompany: (id: number): Promise<ApiResponse<null>> => apiFetch(`/companies/${id}`, { method: 'DELETE' }),
  users: (id: number): Promise<ApiResponse<ManagedUser[]>> => apiFetch(`/companies/${id}/users`),
  audit: (id: number, params?: { date_from?: string; date_to?: string; user_id?: number }): Promise<ApiResponse<Array<{id:string;user:string;action:string;detail:string;created_at:string}>>> => { const q = new URLSearchParams(); if(params?.date_from)q.set('date_from',params.date_from); if(params?.date_to)q.set('date_to',params.date_to); if(params?.user_id)q.set('user_id',String(params.user_id)); return apiFetch(`/companies/${id}/audit${q.size?`?${q}`:''}`); },
  createUser: (id: number, data: Record<string, unknown>): Promise<ApiResponse<ManagedUser>> => apiFetch(`/companies/${id}/users`, { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (companyId: number, userId: number, data: Record<string, unknown>): Promise<ApiResponse<ManagedUser>> => apiFetch(`/companies/${companyId}/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (companyId: number, userId: number): Promise<ApiResponse<null>> => apiFetch(`/companies/${companyId}/users/${userId}`, { method: 'DELETE' }),
};

// ─── Tipos de catálogo ────────────────────────────────────────────────────────

export interface Category {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
}

export interface Product {
  id: number;
  company_id: number;
  category_id: number | null;
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'>;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  price: string;          // decimal como string desde Laravel
  cost: string;
  tax_rate: string;
  stock: string;
  stock_min: string;
  unit: string;
  is_active: boolean;
  track_stock: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  active?: boolean;
  low_stock?: boolean;
  per_page?: number;
  page?: number;
}

// ─── API de Categorías ────────────────────────────────────────────────────────

export const categoryApi = {
  list: (params?: { active?: boolean }): Promise<ApiResponse<Category[]>> => {
    const qs = params?.active !== undefined ? `?active=${params.active}` : '';
    return apiFetch(`/categories${qs}`);
  },

  get: (id: number): Promise<ApiResponse<Category>> =>
    apiFetch(`/categories/${id}`),

  create: (data: Partial<Category>): Promise<ApiResponse<Category>> =>
    apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Category>): Promise<ApiResponse<Category>> =>
    apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number): Promise<ApiResponse<null>> =>
    apiFetch(`/categories/${id}`, { method: 'DELETE' }),
};

// ─── API de Productos ─────────────────────────────────────────────────────────

export const productApi = {
  list: (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (filters?.search)      params.set('search', filters.search);
    if (filters?.category_id) params.set('category_id', String(filters.category_id));
    if (filters?.active !== undefined) params.set('active', String(filters.active));
    if (filters?.low_stock)   params.set('low_stock', '1');
    if (filters?.per_page)    params.set('per_page', String(filters.per_page));
    if (filters?.page)        params.set('page', String(filters.page));
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch(`/products${qs}`);
  },

  get: (id: number): Promise<ApiResponse<Product>> =>
    apiFetch(`/products/${id}`),

  search: (q: string): Promise<ApiResponse<Product[]>> =>
    apiFetch(`/products/search?q=${encodeURIComponent(q)}`),

  create: (data: Partial<Product> | FormData): Promise<ApiResponse<Product>> =>
    apiFetch('/products', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),

  update: (id: number, data: Partial<Product> | FormData): Promise<ApiResponse<Product>> =>
    apiFetch(`/products/${id}`, { method: data instanceof FormData ? 'POST' : 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }),

  delete: (id: number): Promise<ApiResponse<null>> =>
    apiFetch(`/products/${id}`, { method: 'DELETE' }),
};

// ─── Tipos de Inventario y Kardex ─────────────────────────────────────────────

export interface InventorySummary {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_inventory_value: number;
}

export interface InventoryMovement {
  id: number;
  company_id: number;
  product_id: number;
  user_id: number | null;
  type: 'entry' | 'exit' | 'adjustment' | 'sale' | 'return' | 'damage';
  quantity: string;
  previous_stock: string;
  current_stock: string;
  unit_cost: string | null;
  reason: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    unit: string;
  };
  user?: {
    id: number;
    name: string;
  };
}

export interface InventoryMovementFilters {
  product_id?: number;
  type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface AdjustStockPayload {
  product_id: number;
  type: 'entry' | 'exit' | 'adjustment' | 'damage';
  quantity: number;
  reason: string;
  reference?: string;
  unit_cost?: number;
  notes?: string;
}

// ─── API de Inventario ────────────────────────────────────────────────────────

export const inventoryApi = {
  summary: (): Promise<ApiResponse<InventorySummary>> =>
    apiFetch('/inventory/summary'),

  movements: (filters?: InventoryMovementFilters): Promise<PaginatedResponse<InventoryMovement>> => {
    const params = new URLSearchParams();
    if (filters?.product_id) params.set('product_id', String(filters.product_id));
    if (filters?.type)       params.set('type', filters.type);
    if (filters?.search)     params.set('search', filters.search);
    if (filters?.date_from)  params.set('date_from', filters.date_from);
    if (filters?.date_to)    params.set('date_to', filters.date_to);
    if (filters?.page)       params.set('page', String(filters.page));
    if (filters?.per_page)   params.set('per_page', String(filters.per_page));
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch(`/inventory/movements${qs}`);
  },

  adjust: (data: AdjustStockPayload): Promise<ApiResponse<{ movement: InventoryMovement; new_stock: string }>> =>
    apiFetch('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Tipos de Clientes ────────────────────────────────────────────────────────

export interface Customer {
  id: number;
  company_id: number;
  document_type: string;
  document_number: string;
  name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  credit_limit: string;
  current_balance: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFilters {
  search?: string;
  active?: boolean;
  per_page?: number;
  page?: number;
}

// ─── API de Clientes ──────────────────────────────────────────────────────────

export const customerApi = {
  list: (filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> => {
    const params = new URLSearchParams();
    if (filters?.search)               params.set('search', filters.search);
    if (filters?.active !== undefined) params.set('active', String(filters.active));
    if (filters?.per_page)             params.set('per_page', String(filters.per_page));
    if (filters?.page)                 params.set('page', String(filters.page));
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch(`/customers${qs}`);
  },

  get: (id: number): Promise<ApiResponse<Customer>> =>
    apiFetch(`/customers/${id}`),

  search: (q: string): Promise<ApiResponse<Customer[]>> =>
    apiFetch(`/customers/search?q=${encodeURIComponent(q)}`),

  create: (data: Partial<Customer>): Promise<ApiResponse<Customer>> =>
    apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Customer>): Promise<ApiResponse<Customer>> =>
    apiFetch(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<ApiResponse<null>> =>
    apiFetch(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Tipos de Caja ────────────────────────────────────────────────────────────

export interface CashSession {
  id: number;
  company_id: number;
  user_id: number;
  opening_amount: string;
  closing_amount: string | null;
  expected_amount: string;
  difference: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  user?: User;
  movements?: CashMovement[];
}

export interface CashMovement {
  id: number;
  company_id: number;
  cash_session_id: number;
  user_id: number;
  type: 'income' | 'withdrawal' | 'expense' | 'sale' | 'cancellation';
  amount: string;
  description: string;
  reference: string | null;
  created_at: string;
}

export interface CashSummary {
  initial: number;
  sales: number;
  income: number;
  withdrawals: number;
  cancellations: number;
  expected: number;
  closing: number | null;
  difference: number;
  status: 'open' | 'closed';
}

export interface CurrentCashData {
  session: CashSession | null;
  summary: CashSummary;
  movements: CashMovement[];
}

// ─── API de Caja ──────────────────────────────────────────────────────────────

export const cashApi = {
  getCurrent: (): Promise<ApiResponse<CurrentCashData | null>> =>
    apiFetch('/cash-sessions/current'),

  open: (data: { opening_amount: number; notes?: string }): Promise<ApiResponse<{ session: CashSession; summary: CashSummary }>> =>
    apiFetch('/cash-sessions/open', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recordMovement: (
    sessionId: number,
    data: { type: 'income' | 'expense' | 'withdrawal'; amount: number; description: string; reference?: string }
  ): Promise<ApiResponse<{ movement: CashMovement; summary: CashSummary }>> =>
    apiFetch(`/cash-sessions/${sessionId}/movements`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  close: (
    sessionId: number,
    data: { closing_amount: number; notes?: string }
  ): Promise<ApiResponse<{ session: CashSession; summary: CashSummary; close_summary: any }>> =>
    apiFetch(`/cash-sessions/${sessionId}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (params?: { status?: string; page?: number; per_page?: number }): Promise<PaginatedResponse<CashSession>> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const query = qs.toString() ? `?${qs}` : '';
    return apiFetch(`/cash-sessions${query}`);
  },

  get: (id: number): Promise<ApiResponse<{ session: CashSession; summary: CashSummary; movements: CashMovement[] }>> =>
    apiFetch(`/cash-sessions/${id}`),
};

// ─── Tipos de Ventas / Facturación ─────────────────────────────────────────────

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  product_sku: string | null;
  quantity: string | number;
  unit_price: string | number;
  unit_cost: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  subtotal: string | number;
  total: string | number;
  product?: Product;
}

export interface Payment {
  id: number;
  sale_id: number;
  cash_session_id: number | null;
  payment_method: 'cash' | 'card' | 'transfer' | 'credit' | 'other';
  amount: string | number;
  tendered: string | number | null;
  change: string | number;
  reference: string | null;
  notes: string | null;
}

export interface Sale {
  id: number;
  company_id: number;
  user_id: number;
  customer_id: number | null;
  cash_session_id: number | null;
  invoice_number: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total: string;
  status: 'completed' | 'cancelled';
  payment_status: 'paid' | 'partial' | 'pending';
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer | null;
  user?: User;
  items?: SaleItem[];
  payments?: Payment[];
}

export interface CreateSaleItemPayload {
  product_id: number;
  quantity: number;
  unit_price?: number;
  discount_amount?: number;
}

export interface CreatePaymentPayload {
  payment_method: 'cash' | 'card' | 'transfer' | 'credit' | 'other';
  amount?: number;
  tendered?: number;
  reference?: string;
}

export interface CreateSalePayload {
  customer_id?: number | null;
  discount_amount?: number;
  notes?: string;
  items: CreateSaleItemPayload[];
  payments?: CreatePaymentPayload[];
}

export interface SaleFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

// ─── API de Ventas ────────────────────────────────────────────────────────────

export const saleApi = {
  list: (filters?: SaleFilters): Promise<PaginatedResponse<Sale>> => {
    const params = new URLSearchParams();
    if (filters?.search)         params.set('search', filters.search);
    if (filters?.status)         params.set('status', filters.status);
    if (filters?.payment_status) params.set('payment_status', filters.payment_status);
    if (filters?.customer_id)    params.set('customer_id', String(filters.customer_id));
    if (filters?.date_from)      params.set('date_from', filters.date_from);
    if (filters?.date_to)        params.set('date_to', filters.date_to);
    if (filters?.per_page)       params.set('per_page', String(filters.per_page));
    if (filters?.page)           params.set('page', String(filters.page));
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch(`/sales${qs}`);
  },

  get: (id: number): Promise<ApiResponse<Sale>> =>
    apiFetch(`/sales/${id}`),

  create: (data: CreateSalePayload): Promise<ApiResponse<Sale>> =>
    apiFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id: number, reason: string): Promise<ApiResponse<Sale>> =>
    apiFetch(`/sales/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ─── Tipos de Dashboard y Reportes ─────────────────────────────────────────────

export interface DashboardStats {
  kpis: {
    today_sales: number;
    today_count: number;
    today_customers: number;
    avg_ticket_today: number;
    month_sales: number;
    month_count: number;
    month_items_sold: number;
    total_customers: number;
  };
  filter_summary?: { sales: number; revenue: number } | null;
  sales_chart: Array<{ day: string; date: string; total: number }>;
  top_products: Array<{ name: string; qty: number; revenue: number }>;
  low_stock_alerts: Array<{ id: number; name: string; sku: string; stock: number; stock_min: number }>;
  payments_distribution: Array<{ method: string; amount: number }>;
}

export interface ReportsSummary {
  summary: {
    total_revenue: number;
    total_sales: number;
    avg_ticket: number;
    unique_customers: number;
    total_cost: number;
    gross_margin: number;
    gross_margin_percentage: number;
  };
  by_cashier: Array<{ user_id: number; name: string; sales: number; total: number }>;
  sales_chart: Array<{ day: string; date: string; total: number; sales: number }>;
  payments_distribution: Array<{ method: string; amount: number }>;
}

export const dashboardApi = {
  getStats: (params?: { date_from?: string; date_to?: string }): Promise<ApiResponse<DashboardStats>> => {
    const qs = new URLSearchParams();
    if (params?.date_from) qs.set('date_from', params.date_from);
    if (params?.date_to) qs.set('date_to', params.date_to);
    return apiFetch(`/dashboard/stats${qs.size ? `?${qs}` : ''}`);
  },

  getReports: (params?: { date_from?: string; date_to?: string }): Promise<ApiResponse<ReportsSummary>> => {
    const qs = new URLSearchParams();
    if (params?.date_from) qs.set('date_from', params.date_from);
    if (params?.date_to)   qs.set('date_to', params.date_to);
    const query = qs.toString() ? `?${qs}` : '';
    return apiFetch(`/reports/summary${query}`);
  },
};

// ─── API de Configuración de Empresa ──────────────────────────────────────────

export const companyApi = {
  get: (): Promise<ApiResponse<Company>> =>
    apiFetch('/company'),

  update: (data: Partial<Company> | FormData): Promise<ApiResponse<Company>> => {
    if (data instanceof FormData) {
      data.set('_method', 'PUT');
      return apiFetch('/company', { method: 'POST', body: data });
    }
    return apiFetch('/company', { method: 'PUT', body: JSON.stringify(data) });
  },
};

export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  if (!path.includes('/')) return undefined;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}/${path.replace(/^\/+/, '')}`;
}

// ─── API de Gestión de Usuarios ───────────────────────────────────────────────

export const userApi = {
  list: (): Promise<ApiResponse<User[]>> =>
    apiFetch('/users'),

  create: (data: { name: string; email: string; password?: string; role: string; phone?: string; status?: string }): Promise<ApiResponse<User>> =>
    apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<User> & { password?: string }): Promise<ApiResponse<User>> =>
    apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<ApiResponse<null>> =>
    apiFetch(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// ─── API de Auditoría ─────────────────────────────────────────────────────────

export interface AuditLogItem {
  id: string;
  user: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
  date: string;
}

export const auditApi = {
  getLogs: (): Promise<ApiResponse<AuditLogItem[]>> =>
    apiFetch('/audit/logs'),
};
