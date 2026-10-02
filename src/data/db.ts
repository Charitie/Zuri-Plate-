import * as SQLite from 'expo-sqlite';
import { migrations as allMigrations, Migration } from './migrations';

const DB_NAME = 'meal_calendar.db';

// Cache the promise, not the instance: concurrent callers during startup share
// one open + migrate instead of racing to run migrations twice.
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens (or returns the cached) database connection and runs pending migrations.
 * Safe to call from anywhere; the first call does the work.
 */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate().catch((e) => {
      dbPromise = null; // allow a retry instead of caching the failure forever
      throw e;
    });
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(db);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

/** The slice of a database the migration runner needs (lets tests pass an in-memory fake). */
export interface MigratableDb {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/**
 * Applies every migration newer than the DB's `user_version`, each in its own
 * transaction, bumping `user_version` in the same transaction so a crash never
 * leaves a half-applied migration marked as done.
 *
 * Foreign keys are switched off while migrating (SQLite ignores that pragma inside
 * a transaction) so table rebuilds don't trigger cascades; `foreign_key_check`
 * then verifies nothing was left dangling.
 */
export async function runMigrations(db: MigratableDb, migrations: Migration[] = allMigrations): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  const pending = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
  if (pending.length === 0) return;

  await db.execAsync('PRAGMA foreign_keys = OFF;');
  for (const m of pending) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(m.sql);
      const violation = await db.getFirstAsync('PRAGMA foreign_key_check');
      if (violation) throw new Error(`Migration ${m.version} left a foreign key violation`);
      await db.execAsync(`PRAGMA user_version = ${m.version}`);
    });
  }
}

/** Test/dev helper: wipes the DB file so the next getDb() starts clean. */
export async function resetDb(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
}
