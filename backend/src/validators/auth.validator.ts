const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(data: unknown): {
  value: { email: string; password: string; name: string };
  errors: Record<string, string> | null;
} {
  const errors: Record<string, string> = {};

  if (typeof data !== 'object' || data === null) {
    return { value: { email: '', password: '', name: '' }, errors: { _: 'Invalid request body' } };
  }

  const body = data as Record<string, unknown>;

  // email
  let email = '';
  if (typeof body.email !== 'string' || body.email.trim() === '') {
    errors.email = 'Email is required';
  } else {
    email = body.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Invalid email format';
    }
  }

  // password
  let password = '';
  if (typeof body.password !== 'string' || body.password.trim() === '') {
    errors.password = 'Password is required';
  } else {
    password = body.password; // do NOT trim passwords
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least one number';
    }
  }

  // name
  let name = '';
  if (typeof body.name !== 'string' || body.name.trim() === '') {
    errors.name = 'Name is required';
  } else {
    name = body.name.trim();
    if (name.length > 100) {
      errors.name = 'Name must be 100 characters or fewer';
    }
  }

  return {
    value: { email, password, name },
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}

export function validateLogin(data: unknown): {
  value: { email: string; password: string };
  errors: Record<string, string> | null;
} {
  const errors: Record<string, string> = {};

  if (typeof data !== 'object' || data === null) {
    return { value: { email: '', password: '' }, errors: { _: 'Invalid request body' } };
  }

  const body = data as Record<string, unknown>;

  let email = '';
  if (typeof body.email !== 'string' || body.email.trim() === '') {
    errors.email = 'Email is required';
  } else {
    email = body.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Invalid email format';
    }
  }

  let password = '';
  if (typeof body.password !== 'string' || body.password === '') {
    errors.password = 'Password is required';
  } else {
    password = body.password;
  }

  return {
    value: { email, password },
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}
