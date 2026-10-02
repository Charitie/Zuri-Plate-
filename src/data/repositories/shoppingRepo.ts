import * as Crypto from 'expo-crypto';
import { getDb } from '../db';
import { ShoppingListItem, ShoppingCategory } from '../types';
import { nowTimestamp } from '@/services/dateService';

interface ItemRow {
  id: string;
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: string;
  checked: number;
  list_generated_at: string;
}

function rowToItem(row: ItemRow): ShoppingListItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    checked: !!row.checked,
    listGeneratedAt: row.list_generated_at,
  };
}

export const shoppingRepo = {
  /** Replaces the current list with a freshly generated one. */
  async replaceList(items: Omit<ShoppingListItem, 'id' | 'checked' | 'listGeneratedAt'>[]): Promise<void> {
    const db = await getDb();
    const generatedAt = nowTimestamp();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM shopping_list_items`);
      for (const item of items) {
        await db.runAsync(
          `INSERT INTO shopping_list_items (id, name, category, quantity, unit, checked, list_generated_at)
           VALUES (?, ?, ?, ?, ?, 0, ?)`,
          [Crypto.randomUUID(), item.name, item.category, item.quantity, item.unit, generatedAt]
        );
      }
    });
  },

  async listAll(): Promise<ShoppingListItem[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ItemRow>(
      `SELECT * FROM shopping_list_items ORDER BY category ASC, name ASC`
    );
    return rows.map(rowToItem);
  },

  async setChecked(id: string, checked: boolean): Promise<void> {
    const db = await getDb();
    await db.runAsync(`UPDATE shopping_list_items SET checked = ? WHERE id = ?`, [checked ? 1 : 0, id]);
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM shopping_list_items`);
  },
};
