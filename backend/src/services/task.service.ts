import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/connection';
import { Task, TaskQueryParams, PaginationMeta } from '../types';
import { NotFoundError } from '../errors/NotFoundError';
import { ForbiddenError } from '../errors/ForbiddenError';
import { ValidationError } from '../errors/ValidationError';

const ALLOWED_SORT_COLUMNS = [
  'title',
  'status',
  'priority',
  'due_date',
  'created_at',
  'updated_at',
];

export function listTasks(
  userId: string,
  role: 'admin' | 'user',
  params: TaskQueryParams
): { data: Task[]; meta: PaginationMeta } {
  const db = getDb();

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const queryParams: unknown[] = [];

  // Role-based visibility
  if (role !== 'admin') {
    conditions.push('(created_by = ? OR assigned_to = ?)');
    queryParams.push(userId, userId);
  }

  // Filters
  if (params.status) {
    conditions.push('status = ?');
    queryParams.push(params.status);
  }

  if (params.priority) {
    conditions.push('priority = ?');
    queryParams.push(params.priority);
  }

  if (params.assignedTo) {
    conditions.push('assigned_to = ?');
    queryParams.push(params.assignedTo);
  }

  if (params.search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    const searchTerm = `%${params.search}%`;
    queryParams.push(searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort — validate against whitelist before embedding
  const sortBy =
    params.sortBy && ALLOWED_SORT_COLUMNS.includes(params.sortBy) ? params.sortBy : 'created_at';
  const order = params.order === 'asc' ? 'ASC' : 'DESC';

  // Count total
  const countSql = `SELECT COUNT(*) as total FROM tasks ${whereClause}`;
  const countResult = db.prepare(countSql).get(...(queryParams as [])) as { total: number };
  const total = countResult.total;

  // Fetch rows
  const dataSql = `SELECT * FROM tasks ${whereClause} ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
  const dataParams = [...queryParams, limit, offset];
  const rows = db.prepare(dataSql).all(...(dataParams as [])) as Task[];

  const totalPages = Math.ceil(total / limit);

  return {
    data: rows,
    meta: { page, limit, total, totalPages },
  };
}

export function getTask(taskId: string, userId: string, role: 'admin' | 'user'): Task {
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task | undefined;

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  if (role !== 'admin') {
    if (task.created_by !== userId && task.assigned_to !== userId) {
      throw new ForbiddenError('Access denied');
    }
  }

  return task;
}

export async function createTask(
  data: {
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    assigned_to: string | null;
  },
  userId: string
): Promise<Task> {
  const db = getDb();

  // Verify assignedTo user exists if provided
  if (data.assigned_to) {
    const assignedUser = db.prepare('SELECT id FROM users WHERE id = ?').get(data.assigned_to);
    if (!assignedUser) {
      throw new ValidationError('Validation failed', {
        assignedTo: 'Assigned user does not exist',
      });
    }
  }

  const id = uuidv4();

  db.prepare(
    `INSERT INTO tasks (id, title, description, status, priority, due_date, assigned_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.title,
    data.description,
    data.status,
    data.priority,
    data.due_date,
    data.assigned_to,
    userId
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
  return task;
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string | null;
    assigned_to?: string | null;
  },
  userId: string,
  role: 'admin' | 'user'
): Promise<Task> {
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task | undefined;
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  if (role !== 'admin') {
    if (task.created_by !== userId && task.assigned_to !== userId) {
      throw new ForbiddenError('Access denied');
    }
  }

  // Verify assignedTo user exists if being set
  if (data.assigned_to !== undefined && data.assigned_to !== null) {
    const assignedUser = db.prepare('SELECT id FROM users WHERE id = ?').get(data.assigned_to);
    if (!assignedUser) {
      throw new ValidationError('Validation failed', {
        assignedTo: 'Assigned user does not exist',
      });
    }
  }

  // Build dynamic SET clause
  const setClauses: string[] = [];
  const setParams: unknown[] = [];

  if (data.title !== undefined) {
    setClauses.push('title = ?');
    setParams.push(data.title);
  }

  if (data.description !== undefined) {
    setClauses.push('description = ?');
    setParams.push(data.description);
  }

  if (data.status !== undefined) {
    setClauses.push('status = ?');
    setParams.push(data.status);
  }

  if (data.priority !== undefined) {
    setClauses.push('priority = ?');
    setParams.push(data.priority);
  }

  if (data.due_date !== undefined) {
    setClauses.push('due_date = ?');
    setParams.push(data.due_date);
  }

  if (data.assigned_to !== undefined) {
    setClauses.push('assigned_to = ?');
    setParams.push(data.assigned_to);
  }

  // Always update updated_at
  setClauses.push("updated_at = datetime('now')");

  const sql = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`;
  setParams.push(taskId);

  db.prepare(sql).run(...(setParams as []));

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;
  return updated;
}

export function deleteTask(taskId: string, userId: string, role: 'admin' | 'user'): void {
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task | undefined;
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  if (role !== 'admin') {
    // User can only delete if they are the creator (NOT if just assigned)
    if (task.created_by !== userId) {
      throw new ForbiddenError('Access denied');
    }
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
}
