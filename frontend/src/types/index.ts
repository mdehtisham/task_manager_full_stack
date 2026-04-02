export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskFilters {
  status: string;
  priority: string;
  search: string;
  sortBy: string;
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
