import { config } from './config';
import { getDb } from './database/connection';
import { runMigrations } from './database/migrations/runner';
import { seedDatabase } from './database/seed';
import app from './app';

async function start(): Promise<void> {
  const db = getDb();
  runMigrations(db);
  await seedDatabase(db);

  app.listen(config.port, () => {
    console.log(`[Server] Running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
