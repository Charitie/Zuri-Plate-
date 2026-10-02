import * as Crypto from 'expo-crypto';
import { getDb } from '../db';
import { CalendarEntry, CalendarEntryWithMeal, MealType } from '../types';
import { rowToMeal } from './mealsRepo';

interface EntryRow {
  id: string;
  date: string;
  slot: MealType;
  meal_id: string;
  servings_used: number;
  is_leftover: number;
  source_entry_id: string | null;
  eaten: number;
}

interface EntryWithMealRow extends EntryRow {
  m_name: string;
  m_type: MealType;
  m_protein_g: number;
  m_servings: number;
  m_photo_uri: string | null;
  m_created_at: string;
  m_updated_at: string;
}

function rowToEntry(row: EntryRow): CalendarEntry {
  return {
    id: row.id,
    date: row.date,
    slot: row.slot,
    mealId: row.meal_id,
    servingsUsed: row.servings_used,
    isLeftover: !!row.is_leftover,
    sourceEntryId: row.source_entry_id,
    eaten: !!row.eaten,
  };
}

function rowToEntryWithMeal(row: EntryWithMealRow): CalendarEntryWithMeal {
  return {
    ...rowToEntry(row),
    meal: rowToMeal({
      id: row.meal_id,
      name: row.m_name,
      type: row.m_type,
      protein_g: row.m_protein_g,
      servings: row.m_servings,
      photo_uri: row.m_photo_uri,
      created_at: row.m_created_at,
      updated_at: row.m_updated_at,
    }),
  };
}

// One query for entries + their meals (instead of one extra query per entry).
// INNER JOIN is safe: meal_id is NOT NULL and cascades on meal delete.
const SELECT_WITH_MEAL = `
  SELECT ce.*,
         m.name AS m_name, m.type AS m_type, m.protein_g AS m_protein_g, m.servings AS m_servings,
         m.photo_uri AS m_photo_uri, m.created_at AS m_created_at, m.updated_at AS m_updated_at
  FROM calendar_entries ce
  JOIN meals m ON m.id = ce.meal_id`;

const SLOT_ORDER = `CASE ce.slot WHEN 'breakfast' THEN 0 WHEN 'lunch' THEN 1 WHEN 'dinner' THEN 2 ELSE 3 END`;

const INSERT_SQL = `INSERT INTO calendar_entries (id, date, slot, meal_id, servings_used, is_leftover, source_entry_id, eaten)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

function insertParams(e: CalendarEntry) {
  return [e.id, e.date, e.slot, e.mealId, e.servingsUsed, e.isLeftover ? 1 : 0, e.sourceEntryId, e.eaten ? 1 : 0];
}

export const calendarRepo = {
  async create(entry: Omit<CalendarEntry, 'id'>): Promise<CalendarEntry> {
    const db = await getDb();
    const full = { id: Crypto.randomUUID(), ...entry };
    await db.runAsync(INSERT_SQL, insertParams(full));
    return full;
  },

  /**
   * Atomically replaces everything planned in [startDate, endDate] with `entries`.
   * Either the whole plan is saved or nothing changes — no half-written weeks if
   * the app is killed, and regenerating never duplicates.
   */
  async replaceRange(startDate: string, endDate: string, entries: CalendarEntry[]): Promise<void> {
    const db = await getDb();
    // Leftovers reference their source dinner, so insert sources first.
    const ordered = [...entries].sort((a, b) => Number(a.isLeftover) - Number(b.isLeftover));
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM calendar_entries WHERE date >= ? AND date <= ?`, [startDate, endDate]);
      for (const e of ordered) {
        await db.runAsync(INSERT_SQL, insertParams(e));
      }
    });
  },

  /**
   * Atomically replaces whatever is in `slot` on `date` with `entries` (which may
   * include a leftover lunch on the next day). Leftovers of a replaced dinner are
   * removed with it (ON DELETE CASCADE).
   */
  async replaceSlot(date: string, slot: MealType, entries: CalendarEntry[]): Promise<void> {
    const db = await getDb();
    const ordered = [...entries].sort((a, b) => Number(a.isLeftover) - Number(b.isLeftover));
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM calendar_entries WHERE date = ? AND slot = ?`, [date, slot]);
      for (const e of ordered) {
        await db.runAsync(INSERT_SQL, insertParams(e));
      }
    });
  },

  async update(id: string, patch: Partial<Omit<CalendarEntry, 'id'>>): Promise<void> {
    const db = await getDb();
    const existing = await db.getFirstAsync<EntryRow>(`SELECT * FROM calendar_entries WHERE id = ?`, [id]);
    if (!existing) throw new Error(`Calendar entry ${id} not found`);
    const merged = { ...rowToEntry(existing), ...patch };
    await db.runAsync(
      `UPDATE calendar_entries SET date=?, slot=?, meal_id=?, servings_used=?, is_leftover=?, source_entry_id=?, eaten=? WHERE id=?`,
      [
        merged.date,
        merged.slot,
        merged.mealId,
        merged.servingsUsed,
        merged.isLeftover ? 1 : 0,
        merged.sourceEntryId,
        merged.eaten ? 1 : 0,
        id,
      ]
    );
  },

  /** Leftovers made from this entry are removed too (ON DELETE CASCADE). */
  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM calendar_entries WHERE id = ?`, [id]);
  },

  async deleteByDateRange(startDate: string, endDate: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM calendar_entries WHERE date >= ? AND date <= ?`, [startDate, endDate]);
  },

  async listByDate(date: string): Promise<CalendarEntryWithMeal[]> {
    return this.listByDateRange(date, date);
  },

  async listByDateRange(startDate: string, endDate: string): Promise<CalendarEntryWithMeal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<EntryWithMealRow>(
      `${SELECT_WITH_MEAL} WHERE ce.date >= ? AND ce.date <= ? ORDER BY ce.date ASC, ${SLOT_ORDER}`,
      [startDate, endDate]
    );
    return rows.map(rowToEntryWithMeal);
  },

  async findDinner(date: string): Promise<CalendarEntry | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<EntryRow>(
      `SELECT * FROM calendar_entries WHERE date = ? AND slot = 'dinner' LIMIT 1`,
      [date]
    );
    return row ? rowToEntry(row) : null;
  },
};
