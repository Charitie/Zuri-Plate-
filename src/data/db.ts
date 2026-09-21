import * as SQLite from 'expo-sqlite';
import initSql from './migrations/001_init.sql';

const DB_NAME = 'meal_calendar.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (or returns the cached) database connection and runs migrations.
 * Call once at app startup, before any repository is used.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);

  dbInstance = db;
  return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Note: expo-sqlite's `import ... from '*.sql'` requires a bundler transform
  // (see metro.config.js). If your setup doesn't support importing raw SQL,
  // inline the migration string here instead.
  await db.execAsync(initSql as unknown as string);
}

/** Test/dev helper: wipes the DB file so the next getDb() starts clean. */
export async function resetDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
}
