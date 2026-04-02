import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/connection';
import { config } from '../config';
import { UserRow, User, JwtPayload } from '../types';
import { ValidationError } from '../errors/ValidationError';
import { AuthenticationError } from '../errors/AuthenticationError';

export async function signup(email: string, password: string, name: string): Promise<User> {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new ValidationError('Validation failed', { email: 'Email already registered' });
  }

  const hash = await bcrypt.hash(password, config.bcryptRounds);
  const id = uuidv4();

  db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(
    id,
    email,
    hash,
    name,
    'user'
  );

  const user = db
    .prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .get(id) as User;
  return user;
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const db = getDb();

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!row) {
    throw new AuthenticationError('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, row.password);
  if (!valid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const payload: JwtPayload = { userId: row.id, email: row.email, role: row.role };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '8h' });

  const user: User = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
  };
  return { token, user };
}

export function getMe(userId: string): User {
  const db = getDb();
  const user = db
    .prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .get(userId) as User | undefined;
  if (!user) throw new AuthenticationError();
  return user;
}
