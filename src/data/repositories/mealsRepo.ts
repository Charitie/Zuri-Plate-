import * as Crypto from 'expo-crypto';
import { getDb } from '../db';
import { Meal, MealIngredient, MealType, NewMealInput } from '../types';
import { nowTimestamp } from '@/services/dateService';
import { resolvePhotoUri, toStoredPhotoPath } from '@/services/photoPaths';
import { isShoppingCategory } from '@/domain/shoppingCategories';

export interface MealRow {
  id: string;
  name: string;
  type: MealType;
  protein_g: number;
  servings: number;
  photo_uri: string | null;
  created_at: string;
  updated_at: string;
}

interface IngredientRow {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
}

function rowToIngredient(r: IngredientRow): MealIngredient {
  return {
    id: r.id,
    mealId: r.meal_id,
    name: r.name,
    quantity: r.quantity,
    unit: r.unit,
    category: isShoppingCategory(r.category) ? r.category : null,
  };
}

const INSERT_INGREDIENT_SQL = `INSERT INTO meal_ingredients (id, meal_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?, ?)`;

function insertIngredientParams(mealId: string, ing: NewMealInput['ingredients'][number]) {
  return [Crypto.randomUUID(), mealId, ing.name, ing.quantity, ing.unit, ing.category ?? null];
}

export function rowToMeal(row: MealRow): Meal {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    proteinG: row.protein_g,
    servings: row.servings,
    photoUri: resolvePhotoUri(row.photo_uri),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const mealsRepo = {
  async create(input: NewMealInput): Promise<Meal> {
    const db = await getDb();
    const id = Crypto.randomUUID();
    const now = nowTimestamp();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO meals (id, name, type, protein_g, servings, photo_uri, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, input.name, input.type, input.proteinG, input.servings, toStoredPhotoPath(input.photoUri ?? null), now, now]
      );
      for (const ing of input.ingredients) {
        await db.runAsync(INSERT_INGREDIENT_SQL, insertIngredientParams(id, ing));
      }
    });

    return { id, name: input.name, type: input.type, proteinG: input.proteinG, servings: input.servings, photoUri: input.photoUri ?? null, createdAt: now, updatedAt: now };
  },

  async update(id: string, patch: Partial<NewMealInput>): Promise<void> {
    const db = await getDb();
    const now = nowTimestamp();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Meal ${id} not found`);

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE meals SET name = ?, type = ?, protein_g = ?, servings = ?, photo_uri = ?, updated_at = ? WHERE id = ?`,
        [
          patch.name ?? existing.name,
          patch.type ?? existing.type,
          patch.proteinG ?? existing.proteinG,
          patch.servings ?? existing.servings,
          toStoredPhotoPath(patch.photoUri !== undefined ? patch.photoUri : existing.photoUri),
          now,
          id,
        ]
      );

      if (patch.ingredients) {
        await db.runAsync(`DELETE FROM meal_ingredients WHERE meal_id = ?`, [id]);
        for (const ing of patch.ingredients) {
          await db.runAsync(INSERT_INGREDIENT_SQL, insertIngredientParams(id, ing));
        }
      }
    });
  },

  /** Also removes the meal's ingredients and calendar entries (ON DELETE CASCADE). */
  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM meals WHERE id = ?`, [id]);
  },

  async getById(id: string): Promise<Meal | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<MealRow>(`SELECT * FROM meals WHERE id = ?`, [id]);
    return row ? rowToMeal(row) : null;
  },

  async getIngredients(mealId: string): Promise<MealIngredient[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<IngredientRow>(`SELECT * FROM meal_ingredients WHERE meal_id = ?`, [mealId]);
    return rows.map(rowToIngredient);
  },

  /** Ingredients for many meals in one query, keyed by meal id. */
  async getIngredientsForMeals(mealIds: string[]): Promise<Record<string, MealIngredient[]>> {
    const result: Record<string, MealIngredient[]> = Object.fromEntries(mealIds.map((id) => [id, []]));
    if (mealIds.length === 0) return result;
    const db = await getDb();
    const placeholders = mealIds.map(() => '?').join(',');
    const rows = await db.getAllAsync<IngredientRow>(
      `SELECT * FROM meal_ingredients WHERE meal_id IN (${placeholders})`,
      mealIds
    );
    for (const r of rows) {
      result[r.meal_id].push(rowToIngredient(r));
    }
    return result;
  },

  async listAll(): Promise<Meal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MealRow>(`SELECT * FROM meals ORDER BY name ASC`);
    return rows.map(rowToMeal);
  },

  async listByType(type: MealType): Promise<Meal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MealRow>(`SELECT * FROM meals WHERE type = ? ORDER BY name ASC`, [type]);
    return rows.map(rowToMeal);
  },
};
