import request from 'supertest';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import app from '../../src/app';
import { createTestDb } from '../../src/database/connection';
import { runMigrations } from '../../src/database/migrations/runner';
import Database from 'better-sqlite3';

let testDb: Database.Database;

jest.mock('../../src/database/connection', () => {
  const { createTestDb: _createTestDb } = jest.requireActual('../../src/database/connection');
  return {
    getDb: () => testDb,
    createTestDb: _createTestDb,
    closeDb: jest.fn(),
  };
});

beforeAll(() => {
  testDb = createTestDb();
  runMigrations(testDb);
});

afterAll(() => {
  testDb.close();
});

// ─── Test state ────────────────────────────────────────────────────────────────

let adminToken: string;
let userToken: string;
let adminId: string;
let userId: string;
let otherUserId: string;
let otherUserToken: string;

async function seedUsers() {
  testDb.exec('DELETE FROM tasks');
  testDb.exec('DELETE FROM users');

  adminId = uuidv4();
  userId = uuidv4();
  otherUserId = uuidv4();

  const hash = await bcrypt.hash('Password1', 1); // low rounds for speed in tests

  testDb
    .prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
    .run(adminId, 'admin@test.com', hash, 'Admin User', 'admin');

  testDb
    .prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
    .run(userId, 'user@test.com', hash, 'Regular User', 'user');

  testDb
    .prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
    .run(otherUserId, 'other@test.com', hash, 'Other User', 'user');

  // Get tokens via login
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Password1' });
  adminToken = adminLogin.body.data.token;

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@test.com', password: 'Password1' });
  userToken = userLogin.body.data.token;

  const otherLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'other@test.com', password: 'Password1' });
  otherUserToken = otherLogin.body.data.token;
}

beforeEach(async () => {
  await seedUsers();
});

// Helper to create a task as admin
async function createTaskAsAdmin(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Admin Task',
      status: 'todo',
      priority: 'medium',
      ...overrides,
    });
  return res.body.data;
}

// Helper to create a task as regular user
async function createTaskAsUser(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      title: 'User Task',
      status: 'todo',
      priority: 'medium',
      ...overrides,
    });
  return res.body.data;
}

// ─── RBAC — User access ───────────────────────────────────────────────────────

describe('RBAC — User access', () => {
  it('user can list own + assigned tasks (not others)', async () => {
    // Task created by user
    await createTaskAsUser({ title: 'My own task' });

    // Task assigned to user (created by admin)
    await createTaskAsAdmin({ title: 'Assigned to user', assigned_to: userId });

    // Task owned by other user (not visible to user)
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ title: 'Other user task', status: 'todo', priority: 'low' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.data.map((t: { title: string }) => t.title);
    expect(titles).toContain('My own task');
    expect(titles).toContain('Assigned to user');
    expect(titles).not.toContain('Other user task');
  });

  it('user cannot GET task belonging to another user (403)', async () => {
    const task = await createTaskAsAdmin({ title: 'Admin only task' });

    const res = await request(app)
      .get(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it('user can update own task', async () => {
    const task = await createTaskAsUser({ title: 'My task to update' });

    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated title');
  });

  it('assigned user can update task', async () => {
    const task = await createTaskAsAdmin({
      title: 'Task assigned to user',
      assigned_to: userId,
    });

    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it("user cannot update task they don't own or aren't assigned to (403)", async () => {
    const task = await createTaskAsAdmin({ title: 'Not user task' });

    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Attempted update' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it('user can delete own task', async () => {
    const task = await createTaskAsUser({ title: 'My task to delete' });

    const res = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(204);
  });

  it('user who is only assigned (not owner) CANNOT delete task (403)', async () => {
    const task = await createTaskAsAdmin({
      title: 'Task where user is only assigned',
      assigned_to: userId,
    });

    const res = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it("user cannot delete another user's task (403)", async () => {
    const task = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ title: 'Other user task', status: 'todo', priority: 'low' });

    const res = await request(app)
      .delete(`/api/tasks/${task.body.data.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── RBAC — Admin access ─────────────────────────────────────────────────────

describe('RBAC — Admin access', () => {
  it('admin can list ALL tasks', async () => {
    await createTaskAsUser({ title: 'User task' });
    await createTaskAsAdmin({ title: 'Admin task' });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ title: 'Other user task', status: 'todo', priority: 'low' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
  });

  it('admin can GET any task', async () => {
    const task = await createTaskAsUser({ title: 'User task for admin get' });

    const res = await request(app)
      .get(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(task.id);
  });

  it('admin can update any task', async () => {
    const task = await createTaskAsUser({ title: 'User task for admin update' });

    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ priority: 'high' });

    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('high');
  });

  it('admin can delete any task', async () => {
    const task = await createTaskAsUser({ title: 'User task for admin delete' });

    const res = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });
});

// ─── Task validation ──────────────────────────────────────────────────────────

describe('Task creation validation', () => {
  it('returns 422 with fields.title when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'todo', priority: 'medium' });

    expect(res.status).toBe(422);
    expect(res.body.fields.title).toBeDefined();
  });

  it('returns 422 when title exceeds 200 chars', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'A'.repeat(201), status: 'todo', priority: 'medium' });

    expect(res.status).toBe(422);
    expect(res.body.fields.title).toBeDefined();
  });

  it('returns 422 when description exceeds 2000 chars', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Valid', description: 'D'.repeat(2001) });

    expect(res.status).toBe(422);
    expect(res.body.fields.description).toBeDefined();
  });

  it('returns 422 for invalid status value', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Valid', status: 'invalid_status' });

    expect(res.status).toBe(422);
    expect(res.body.fields.status).toBeDefined();
  });

  it('returns 422 for invalid priority value', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Valid', priority: 'critical' });

    expect(res.status).toBe(422);
    expect(res.body.fields.priority).toBeDefined();
  });

  it('returns 422 for invalid dueDate format', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Valid', due_date: 'not-a-date' });

    expect(res.status).toBe(422);
    expect(res.body.fields.due_date).toBeDefined();
  });

  it('returns 422 for invalid assignedTo (not UUID)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Valid', assigned_to: 'not-a-uuid' });

    expect(res.status).toBe(422);
    expect(res.body.fields.assignedTo).toBeDefined();
  });

  it('returns 422 when assignedTo references non-existent user', async () => {
    const nonExistentId = uuidv4();
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Valid', assigned_to: nonExistentId });

    expect(res.status).toBe(422);
    expect(res.body.fields.assignedTo).toBeDefined();
  });

  it('strips unknown fields without error', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Valid Task', unknownField: 'ignored', anotherField: 123 });

    expect(res.status).toBe(201);
    expect(res.body.data).not.toHaveProperty('unknownField');
    expect(res.body.data).not.toHaveProperty('anotherField');
  });

  it('accepts valid task with all fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Complete Task',
        description: 'A description',
        status: 'in_progress',
        priority: 'high',
        due_date: '2026-12-31',
        assigned_to: userId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Complete Task');
    expect(res.body.data.status).toBe('in_progress');
  });
});

describe('Task update validation', () => {
  it('returns 404 for non-existent task', async () => {
    const fakeId = uuidv4();
    const res = await request(app)
      .put(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'update' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns 422 if assignedTo is non-existent user in update', async () => {
    const task = await createTaskAsAdmin({ title: 'Task to update' });
    const nonExistentId = uuidv4();

    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigned_to: nonExistentId });

    expect(res.status).toBe(422);
    expect(res.body.fields.assignedTo).toBeDefined();
  });
});

// ─── Query params ─────────────────────────────────────────────────────────────

describe('Task query params', () => {
  beforeEach(async () => {
    await createTaskAsAdmin({ title: 'Done task', status: 'done', priority: 'high' });
    await createTaskAsAdmin({ title: 'Todo task', status: 'todo', priority: 'low' });
    await createTaskAsAdmin({ title: 'Search me task', status: 'todo', priority: 'medium' });
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/tasks?status=done')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((t: { status: string }) => t.status === 'done')).toBe(true);
  });

  it('filters by priority', async () => {
    const res = await request(app)
      .get('/api/tasks?priority=high')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((t: { priority: string }) => t.priority === 'high')).toBe(true);
  });

  it('searches by title (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/tasks?search=SEARCH')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.some((t: { title: string }) =>
        t.title.toLowerCase().includes('search')
      )
    ).toBe(true);
  });

  it('returns correct pagination meta', async () => {
    const res = await request(app)
      .get('/api/tasks?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(2);
    expect(typeof res.body.meta.total).toBe('number');
    expect(typeof res.body.meta.totalPages).toBe('number');
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it('returns 422 for invalid status query param', async () => {
    const res = await request(app)
      .get('/api/tasks?status=invalid')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
  });
});

// ─── Error shapes ─────────────────────────────────────────────────────────────

describe('Error shapes', () => {
  it('403 responses have { error: string }', async () => {
    const task = await createTaskAsAdmin({ title: 'Admin only' });

    const res = await request(app)
      .get(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(typeof res.body.error).toBe('string');
  });

  it('404 responses have { error: string }', async () => {
    const fakeId = uuidv4();
    const res = await request(app)
      .get(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(typeof res.body.error).toBe('string');
  });

  it('401 responses have { error: string }', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(401);
    expect(typeof res.body.error).toBe('string');
  });
});
