import init001 from './001_init';
import integrity002 from './002_integrity';
import shoppingCategories003 from './003_shopping_categories';
import ingredientCategory004 from './004_ingredient_category';
import servingsCooked005 from './005_servings_cooked';

export interface Migration {
  version: number;
  sql: string;
}

/**
 * Ordered schema history. Each migration runs exactly once per device, tracked
 * by SQLite's `PRAGMA user_version`. Never edit a migration that has shipped —
 * add a new one instead.
 */
export const migrations: Migration[] = [
  { version: 1, sql: init001 },
  { version: 2, sql: integrity002 },
  { version: 3, sql: shoppingCategories003 },
  { version: 4, sql: ingredientCategory004 },
  { version: 5, sql: servingsCooked005 },
];
