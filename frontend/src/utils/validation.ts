const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim().toLowerCase())) return 'Invalid email format';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length > 100) return 'Name must be 100 characters or fewer';
  return null;
}

export function validateTitle(title: string): string | null {
  if (!title.trim()) return 'Title is required';
  if (title.trim().length > 200) return 'Title must be 200 characters or fewer';
  return null;
}

export function validateDescription(description: string): string | null {
  if (description.length > 2000) return 'Description must be 2000 characters or fewer';
  return null;
}

export function validateDueDate(dueDate: string): string | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return 'Invalid date format';
  return null;
}

export function extractApiErrors(err: unknown): Record<string, string> {
  const e = err as { response?: { data?: { error?: string; fields?: Record<string, string> } } };
  if (e.response?.data?.fields) return e.response.data.fields;
  return {};
}

export function extractApiError(err: unknown): string {
  const e = err as { response?: { data?: { error?: string } } };
  return e.response?.data?.error || 'Something went wrong';
}
