import { createTestDb } from '../src/database/connection';
import { runMigrations } from '../src/database/migrations/runner';
import Database from 'better-sqlite3';

let testDb: Database.Database;

// Override getDb for tests
jest.mock('../src/database/connection', () => ({
  getDb: () => testDb,
  createTestDb,
  closeDb: jest.fn(),
}));

beforeAll(() => {
  testDb = createTestDb();
  runMigrations(testDb);
});

afterAll(() => {
  testDb.close();
});
