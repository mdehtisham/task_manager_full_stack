const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ALLOWED_STATUSES = ['todo', 'in_progress', 'done'] as const;
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'] as const;
const ALLOWED_SORT_FIELDS = ['title', 'status', 'priority', 'due_date', 'created_at', 'updated_at'];

type Status = typeof ALLOWED_STATUSES[number];
type Priority = typeof ALLOWED_PRIORITIES[number];

export interface CreateTaskValue {
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  assigned_to: string | null;
}

export interface UpdateTaskValue {
  title?: string;
  description?: string | null;
  status?: Status;
  priority?: Priority;
  due_date?: string | null;
  assigned_to?: string | null;
}

export interface TaskQueryValue {
  page: number;
  limit: number;
  status?: Status;
  priority?: Priority;
  assignedTo?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

function isValidDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export function validateCreateTask(data: unknown): {
  value: CreateTaskValue;
  errors: Record<string, string> | null;
} {
  const errors: Record<string, string> = {};
  const defaultValue: CreateTaskValue = {
    title: '',
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    assigned_to: null,
  };

  if (typeof data !== 'object' || data === null) {
    return { value: defaultValue, errors: { _: 'Invalid request body' } };
  }

  const body = data as Record<string, unknown>;

  // title — required, max 200
  let title = '';
  if (typeof body.title !== 'string' || body.title.trim() === '') {
    errors.title = 'Title is required';
  } else {
    title = body.title.trim();
    if (title.length > 200) {
      errors.title = 'Title must be 200 characters or fewer';
    }
  }

  // description — optional, max 2000
  let description: string | null = null;
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.description = 'Description must be a string';
    } else {
      description = body.description.trim() === '' ? null : body.description.trim();
      if (description !== null && description.length > 2000) {
        errors.description = 'Description must be 2000 characters or fewer';
      }
    }
  }

  // status — optional enum, defaults to 'todo'
  let status: Status = 'todo';
  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status as Status)) {
      errors.status = `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`;
    } else {
      status = body.status as Status;
    }
  }

  // priority — optional enum, defaults to 'medium'
  let priority: Priority = 'medium';
  if (body.priority !== undefined) {
    if (!ALLOWED_PRIORITIES.includes(body.priority as Priority)) {
      errors.priority = `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`;
    } else {
      priority = body.priority as Priority;
    }
  }

  // due_date — optional ISO 8601 date (YYYY-MM-DD)
  let due_date: string | null = null;
  if (body.due_date !== undefined && body.due_date !== null && body.due_date !== '') {
    if (typeof body.due_date !== 'string' || !isValidDate(body.due_date)) {
      errors.due_date = 'Due date must be a valid date in YYYY-MM-DD format';
    } else {
      due_date = body.due_date;
    }
  }

  // dueDate — also accept camelCase
  if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '') {
    if (typeof body.dueDate !== 'string' || !isValidDate(body.dueDate as string)) {
      errors.dueDate = 'Due date must be a valid date in YYYY-MM-DD format';
    } else {
      due_date = body.dueDate as string;
    }
  }

  // assigned_to / assignedTo — optional UUID
  let assigned_to: string | null = null;
  const assignedToRaw = body.assigned_to ?? body.assignedTo;
  if (assignedToRaw !== undefined && assignedToRaw !== null && assignedToRaw !== '') {
    if (typeof assignedToRaw !== 'string' || !UUID_REGEX.test(assignedToRaw)) {
      errors.assignedTo = 'assignedTo must be a valid UUID';
    } else {
      assigned_to = assignedToRaw;
    }
  }

  const value: CreateTaskValue = { title, description, status, priority, due_date, assigned_to };

  return {
    value,
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}

export function validateUpdateTask(data: unknown): {
  value: UpdateTaskValue;
  errors: Record<string, string> | null;
} {
  const errors: Record<string, string> = {};

  if (typeof data !== 'object' || data === null) {
    return { value: {}, errors: { _: 'Invalid request body' } };
  }

  const body = data as Record<string, unknown>;
  const value: UpdateTaskValue = {};

  // title — optional, max 200
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.title = 'Title cannot be empty';
    } else {
      const title = body.title.trim();
      if (title.length > 200) {
        errors.title = 'Title must be 200 characters or fewer';
      } else {
        value.title = title;
      }
    }
  }

  // description — optional, max 2000, can be explicitly set to null to clear
  if (body.description !== undefined) {
    if (body.description === null) {
      value.description = null;
    } else if (typeof body.description !== 'string') {
      errors.description = 'Description must be a string';
    } else {
      const desc = body.description.trim();
      if (desc.length > 2000) {
        errors.description = 'Description must be 2000 characters or fewer';
      } else {
        value.description = desc === '' ? null : desc;
      }
    }
  }

  // status — optional enum
  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status as Status)) {
      errors.status = `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`;
    } else {
      value.status = body.status as Status;
    }
  }

  // priority — optional enum
  if (body.priority !== undefined) {
    if (!ALLOWED_PRIORITIES.includes(body.priority as Priority)) {
      errors.priority = `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`;
    } else {
      value.priority = body.priority as Priority;
    }
  }

  // due_date / dueDate — optional ISO 8601 date, null to clear
  const dueDateRaw = body.due_date !== undefined ? body.due_date : body.dueDate;
  if (dueDateRaw !== undefined) {
    if (dueDateRaw === null || dueDateRaw === '') {
      value.due_date = null;
    } else if (typeof dueDateRaw !== 'string' || !isValidDate(dueDateRaw)) {
      errors.dueDate = 'Due date must be a valid date in YYYY-MM-DD format';
    } else {
      value.due_date = dueDateRaw;
    }
  }

  // assigned_to / assignedTo — optional UUID, null to unassign
  const assignedToRaw = body.assigned_to !== undefined ? body.assigned_to : body.assignedTo;
  if (assignedToRaw !== undefined) {
    if (assignedToRaw === null || assignedToRaw === '') {
      value.assigned_to = null;
    } else if (typeof assignedToRaw !== 'string' || !UUID_REGEX.test(assignedToRaw)) {
      errors.assignedTo = 'assignedTo must be a valid UUID';
    } else {
      value.assigned_to = assignedToRaw;
    }
  }

  // At least one field must be provided
  if (Object.keys(value).length === 0 && Object.keys(errors).length === 0) {
    errors._ = 'At least one field must be provided for update';
  }

  return {
    value,
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}

export function validateTaskQuery(data: unknown): {
  value: TaskQueryValue;
  errors: Record<string, string> | null;
} {
  const errors: Record<string, string> = {};
  const defaultValue: TaskQueryValue = { page: 1, limit: 20 };

  if (typeof data !== 'object' || data === null) {
    return { value: defaultValue, errors: null };
  }

  const query = data as Record<string, unknown>;
  const value: TaskQueryValue = { page: 1, limit: 20 };

  // page — coerce to integer
  if (query.page !== undefined) {
    const page = parseInt(String(query.page), 10);
    if (isNaN(page) || page < 1) {
      errors.page = 'Page must be a positive integer';
    } else {
      value.page = page;
    }
  }

  // limit — coerce to integer
  if (query.limit !== undefined) {
    const limit = parseInt(String(query.limit), 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.limit = 'Limit must be an integer between 1 and 100';
    } else {
      value.limit = limit;
    }
  }

  // status — optional enum filter
  if (query.status !== undefined && query.status !== '') {
    if (!ALLOWED_STATUSES.includes(query.status as Status)) {
      errors.status = `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`;
    } else {
      value.status = query.status as Status;
    }
  }

  // priority — optional enum filter
  if (query.priority !== undefined && query.priority !== '') {
    if (!ALLOWED_PRIORITIES.includes(query.priority as Priority)) {
      errors.priority = `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`;
    } else {
      value.priority = query.priority as Priority;
    }
  }

  // assignedTo — optional UUID filter
  if (query.assignedTo !== undefined && query.assignedTo !== '') {
    if (typeof query.assignedTo !== 'string' || !UUID_REGEX.test(query.assignedTo)) {
      errors.assignedTo = 'assignedTo must be a valid UUID';
    } else {
      value.assignedTo = query.assignedTo;
    }
  }

  // sortBy — whitelist check
  if (query.sortBy !== undefined && query.sortBy !== '') {
    if (!ALLOWED_SORT_FIELDS.includes(String(query.sortBy))) {
      errors.sortBy = `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`;
    } else {
      value.sortBy = String(query.sortBy);
    }
  }

  // order — asc or desc
  if (query.order !== undefined && query.order !== '') {
    const order = String(query.order).toLowerCase();
    if (order !== 'asc' && order !== 'desc') {
      errors.order = 'order must be asc or desc';
    } else {
      value.order = order as 'asc' | 'desc';
    }
  }

  // search — optional string
  if (query.search !== undefined && query.search !== '') {
    value.search = String(query.search).trim();
  }

  return {
    value,
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}
