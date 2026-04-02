export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface UserRow extends User {
  password: string;
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

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
