import * as Crypto from 'expo-crypto';
import { getDb } from '../db';
import { CalendarEntry, CalendarEntryWithMeal, MealType } from '../types';
import { mealsRepo } from './mealsRepo';

function rowToEntry(row: any): CalendarEntry {
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

export const calendarRepo = {
  async create(entry: Omit<CalendarEntry, 'id'>): Promise<CalendarEntry> {
    const db = await getDb();
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO calendar_entries (id, date, slot, meal_id, servings_used, is_leftover, source_entry_id, eaten)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.date,
        entry.slot,
        entry.mealId,
        entry.servingsUsed,
        entry.isLeftover ? 1 : 0,
        entry.sourceEntryId,
        entry.eaten ? 1 : 0,
      ]
    );
    return { id, ...entry };
  },

  async update(id: string, patch: Partial<Omit<CalendarEntry, 'id'>>): Promise<void> {
    const db = await getDb();
    const existing = await db.getFirstAsync<any>(`SELECT * FROM calendar_entries WHERE id = ?`, [id]);
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

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM calendar_entries WHERE id = ? OR source_entry_id = ?`, [id, id]);
  },

  async deleteByDateRange(startDate: string, endDate: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM calendar_entries WHERE date >= ? AND date <= ?`, [startDate, endDate]);
  },

  async listByDate(date: string): Promise<CalendarEntryWithMeal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(`SELECT * FROM calendar_entries WHERE date = ?`, [date]);
    return Promise.all(
      rows.map(async (r) => {
        const meal = await mealsRepo.getById(r.meal_id);
        return { ...rowToEntry(r), meal: meal! };
      })
    );
  },

  async listByDateRange(startDate: string, endDate: string): Promise<CalendarEntryWithMeal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM calendar_entries WHERE date >= ? AND date <= ? ORDER BY date ASC`,
      [startDate, endDate]
    );
    return Promise.all(
      rows.map(async (r) => {
        const meal = await mealsRepo.getById(r.meal_id);
        return { ...rowToEntry(r), meal: meal! };
      })
    );
  },

  async findDinnerWithLeftovers(date: string): Promise<CalendarEntry | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM calendar_entries WHERE date = ? AND slot = 'dinner' AND servings_used > 1`,
      [date]
    );
    return row ? rowToEntry(row) : null;
  },
};
