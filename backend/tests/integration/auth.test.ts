import request from 'supertest';
import jwt from 'jsonwebtoken';
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

// Clean up users table between tests to avoid duplicate email issues
afterEach(() => {
  testDb.exec('DELETE FROM tasks');
  testDb.exec('DELETE FROM users');
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  it('returns 201 with user data (no password) on success', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'Password1', name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.name).toBe('Test User');
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.password).toBeUndefined();
  });

  it('returns 422 with fields.email on duplicate email', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'Password1', name: 'User One' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'Password1', name: 'User Two' });

    expect(res.status).toBe(422);
    expect(res.body.fields).toBeDefined();
    expect(res.body.fields.email).toBeDefined();
  });

  it('returns 422 with fields.email when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ password: 'Password1', name: 'Test User' });

    expect(res.status).toBe(422);
    expect(res.body.fields.email).toBeDefined();
  });

  it('returns 422 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'not-an-email', password: 'Password1', name: 'Test User' });

    expect(res.status).toBe(422);
    expect(res.body.fields.email).toBeDefined();
  });

  it('returns 422 with fields.password when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', name: 'Test User' });

    expect(res.status).toBe(422);
    expect(res.body.fields.password).toBeDefined();
  });

  it('returns 422 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'Pass1', name: 'Test User' });

    expect(res.status).toBe(422);
    expect(res.body.fields.password).toBeDefined();
  });

  it('returns 422 when password has no uppercase letter', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password1', name: 'Test User' });

    expect(res.status).toBe(422);
    expect(res.body.fields.password).toMatch(/uppercase/i);
  });

  it('returns 422 when password has no number', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'PasswordOnly', name: 'Test User' });

    expect(res.status).toBe(422);
    expect(res.body.fields.password).toMatch(/number/i);
  });

  it('returns 422 with fields.name when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'Password1' });

    expect(res.status).toBe(422);
    expect(res.body.fields.name).toBeDefined();
  });

  it('strips unknown fields without error', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'strip@example.com',
        password: 'Password1',
        name: 'Strip Test',
        role: 'admin', // should be ignored
        unknownField: 'should be ignored',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('user'); // must not be admin
  });

  it('treats empty string email as missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: '   ', password: 'Password1', name: 'Test User' });

    expect(res.status).toBe(422);
    expect(res.body.fields.email).toBeDefined();
  });

  it('rejects non-string type for email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 123, password: 'Password1', name: 'Test User' });

    expect(res.status).toBe(422);
    expect(res.body.fields.email).toBeDefined();
  });

  it('normalizes email to lowercase', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'UPPER@EXAMPLE.COM', password: 'Password1', name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('upper@example.com');
  });
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'login@example.com', password: 'Password1', name: 'Login User' });
  });

  it('returns 200 with token and user on success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('login@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 401 with wrong email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'Password1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 422 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password1' });

    expect(res.status).toBe(422);
    expect(res.body.fields.email).toBeDefined();
  });

  it('returns 422 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com' });

    expect(res.status).toBe(422);
    expect(res.body.fields.password).toBeDefined();
  });
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  let token: string;

  beforeEach(async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'me@example.com', password: 'Password1', name: 'Me User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@example.com', password: 'Password1' });

    token = loginRes.body.data.token;
  });

  it('returns 200 with current user when token is valid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@example.com');
    expect(res.body.data.password).toBeUndefined();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 with expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: 'some-id', email: 'me@example.com', role: 'user' },
      process.env.JWT_SECRET || 'dev-secret-change-in-production',
      { expiresIn: -1 }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token');

    expect(res.status).toBe(401);
  });

  it('returns 401 with valid format but wrong secret', async () => {
    const wrongSecretToken = jwt.sign(
      { userId: 'some-id', email: 'me@example.com', role: 'user' },
      'wrong-secret-entirely'
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${wrongSecretToken}`);

    expect(res.status).toBe(401);
  });
});

// ─── Error shape consistency ──────────────────────────────────────────────────

describe('Error shape consistency', () => {
  it('4xx responses have { error: string } shape', async () => {
    const res = await request(app).get('/api/auth/me'); // no token

    expect(res.status).toBe(401);
    expect(typeof res.body.error).toBe('string');
  });

  it('422 responses have { error: string, fields: object } shape', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({});

    expect(res.status).toBe(422);
    expect(typeof res.body.error).toBe('string');
    expect(typeof res.body.fields).toBe('object');
    expect(res.body.fields).not.toBeNull();
  });
});
