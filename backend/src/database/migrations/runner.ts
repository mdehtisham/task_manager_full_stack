import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function runMigrations(db: Database.Database): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const migrationsDir = path.join(__dirname);
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of sqlFiles) {
    const alreadyApplied = db
      .prepare('SELECT id FROM _migrations WHERE filename = ?')
      .get(file);

    if (!alreadyApplied) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
      console.log(`[Migration] Applied: ${file}`);
    }
  }
}
