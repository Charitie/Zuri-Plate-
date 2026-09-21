import * as Crypto from 'expo-crypto';
import { getDb } from '../db';
import { Meal, MealIngredient, MealType, NewMealInput } from '../types';
import { nowTimestamp } from '@/services/dateService';

function rowToMeal(row: any): Meal {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    proteinG: row.protein_g,
    servings: row.servings,
    photoUri: row.photo_uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const mealsRepo = {
  async create(input: NewMealInput): Promise<Meal> {
    const db = await getDb();
    const id = Crypto.randomUUID();
    const now = nowTimestamp();

    await db.runAsync(
      `INSERT INTO meals (id, name, type, protein_g, servings, photo_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.name, input.type, input.proteinG, input.servings, input.photoUri ?? null, now, now]
    );

    for (const ing of input.ingredients) {
      await db.runAsync(
        `INSERT INTO meal_ingredients (id, meal_id, name, quantity, unit) VALUES (?, ?, ?, ?, ?)`,
        [Crypto.randomUUID(), id, ing.name, ing.quantity, ing.unit]
      );
    }

    return { id, name: input.name, type: input.type, proteinG: input.proteinG, servings: input.servings, photoUri: input.photoUri ?? null, createdAt: now, updatedAt: now };
  },

  async update(id: string, patch: Partial<NewMealInput>): Promise<void> {
    const db = await getDb();
    const now = nowTimestamp();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Meal ${id} not found`);

    await db.runAsync(
      `UPDATE meals SET name = ?, type = ?, protein_g = ?, servings = ?, photo_uri = ?, updated_at = ? WHERE id = ?`,
      [
        patch.name ?? existing.name,
        patch.type ?? existing.type,
        patch.proteinG ?? existing.proteinG,
        patch.servings ?? existing.servings,
        patch.photoUri !== undefined ? patch.photoUri : existing.photoUri,
        now,
        id,
      ]
    );

    if (patch.ingredients) {
      await db.runAsync(`DELETE FROM meal_ingredients WHERE meal_id = ?`, [id]);
      for (const ing of patch.ingredients) {
        await db.runAsync(
          `INSERT INTO meal_ingredients (id, meal_id, name, quantity, unit) VALUES (?, ?, ?, ?, ?)`,
          [Crypto.randomUUID(), id, ing.name, ing.quantity, ing.unit]
        );
      }
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM meals WHERE id = ?`, [id]);
  },

  async getById(id: string): Promise<Meal | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(`SELECT * FROM meals WHERE id = ?`, [id]);
    return row ? rowToMeal(row) : null;
  },

  async getIngredients(mealId: string): Promise<MealIngredient[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(`SELECT * FROM meal_ingredients WHERE meal_id = ?`, [mealId]);
    return rows.map((r) => ({ id: r.id, mealId: r.meal_id, name: r.name, quantity: r.quantity, unit: r.unit }));
  },

  async listAll(): Promise<Meal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(`SELECT * FROM meals ORDER BY name ASC`);
    return rows.map(rowToMeal);
  },

  async listByType(type: MealType): Promise<Meal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(`SELECT * FROM meals WHERE type = ? ORDER BY name ASC`, [type]);
    return rows.map(rowToMeal);
  },
};
