import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export async function seedDatabase(db: Database.Database): Promise<void> {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existingUsers.count > 0) return;

  console.log('[Seed] Seeding database...');

  const adminId = uuidv4();
  const userId = uuidv4();

  const adminHash = await bcrypt.hash('Admin123!', config.bcryptRounds);
  const userHash = await bcrypt.hash('User123!', config.bcryptRounds);

  const insertUser = db.prepare(
    'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)'
  );

  insertUser.run(adminId, 'admin@example.com', adminHash, 'Admin User', 'admin');
  insertUser.run(userId, 'user@example.com', userHash, 'Regular User', 'user');

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, due_date, assigned_to, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const future = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  insertTask.run(uuidv4(), 'Set up project infrastructure', 'Configure CI/CD pipeline and deployment scripts', 'done', 'high', future(-5), userId, adminId);
  insertTask.run(uuidv4(), 'Design database schema', 'Create ERD and finalize table structures', 'done', 'high', future(-3), adminId, adminId);
  insertTask.run(uuidv4(), 'Implement authentication API', 'Build signup, login, and JWT middleware', 'in_progress', 'high', future(2), userId, adminId);
  insertTask.run(uuidv4(), 'Build task list UI', 'Create paginated task table with filters and sorting', 'todo', 'medium', future(5), userId, userId);
  insertTask.run(uuidv4(), 'Write integration tests', 'Cover auth, RBAC, and validation critical paths', 'todo', 'low', future(7), null, adminId);

  console.log('[Seed] Database seeded successfully.');
}
