/**
 * Minimal expo-sqlite stand-in backed by Node's built-in SQLite (Node >= 22.5),
 * so repository tests run real SQL — constraints, cascades, transactions —
 * without a device. Only the methods the app uses are implemented.
 */
type SQLParam = string | number | null;

interface NodeStatement {
  run(...params: SQLParam[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...params: SQLParam[]): unknown;
  all(...params: SQLParam[]): unknown[];
}
interface NodeDatabase {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
}

// getBuiltinModule sidesteps Jest's resolver, which doesn't know `node:sqlite`.
const { DatabaseSync } = (
  process as unknown as { getBuiltinModule(id: string): { DatabaseSync: new (path: string) => NodeDatabase } }
).getBuiltinModule('node:sqlite');

export function createFakeDb() {
  const db = new DatabaseSync(':memory:');
  // Match the device default (off until db.ts turns it on), not Node's default (on).
  db.exec('PRAGMA foreign_keys = OFF');

  return {
    raw: db,
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, params: SQLParam[] = []) {
      const r = db.prepare(sql).run(...params);
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    async getFirstAsync<T>(sql: string, params: SQLParam[] = []): Promise<T | null> {
      return (db.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, params: SQLParam[] = []): Promise<T[]> {
      return db.prepare(sql).all(...params) as T[];
    },
    async withTransactionAsync(task: () => Promise<void>) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    async closeAsync() {
      db.close();
    },
  };
}

export type FakeDb = ReturnType<typeof createFakeDb>;
