import { getDb } from '../database/connection';

export function getAllUsers(isAdmin: boolean): Record<string, unknown>[] {
  const db = getDb();
  if (isAdmin) {
    return db
      .prepare('SELECT id, name, email, role FROM users ORDER BY name ASC')
      .all() as Record<string, unknown>[];
  }
  return db
    .prepare('SELECT id, name, email FROM users ORDER BY name ASC')
    .all() as Record<string, unknown>[];
}
