import { getDb, resetDb, runMigrations } from '@/data/db';
import { migrations } from '@/data/migrations';
import { calendarRepo } from '@/data/repositories/calendarRepo';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { settingsRepo } from '@/data/repositories/settingsRepo';
import { CalendarEntry, NewMealInput } from '@/data/types';
import { createFakeDb } from '../support/fakeExpoSqlite';

// jest.mock factories are hoisted above imports, so they must use require().
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => require('../support/fakeExpoSqlite').createFakeDb()),
  deleteDatabaseAsync: jest.fn(async () => {}),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));
jest.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file:///docs/' }));
/* eslint-enable @typescript-eslint/no-require-imports */

const chicken: NewMealInput = {
  name: 'Chicken',
  type: 'dinner',
  proteinG: 60,
  servings: 2,
  photoUri: 'file:///docs/meal-photos/abc.jpg',
  ingredients: [{ name: 'Chicken breast', quantity: 400, unit: 'g' }],
};

function entry(overrides: Partial<CalendarEntry> & Pick<CalendarEntry, 'id' | 'mealId' | 'date'>): CalendarEntry {
  return { slot: 'dinner', servingsUsed: 1, isLeftover: false, sourceEntryId: null, eaten: false, ...overrides };
}

beforeEach(async () => {
  await resetDb();
});

describe('migrations', () => {
  it('brings a fresh database to the latest version', async () => {
    const db = await getDb();
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(migrations[migrations.length - 1].version);
  });

  it('is a no-op when already up to date', async () => {
    const db = await getDb();
    await expect(runMigrations(db)).resolves.toBeUndefined();
  });

  it('upgrades a v1 database, keeping valid data and repairing bad data', async () => {
    const db = createFakeDb();
    await runMigrations(db, migrations.slice(0, 1));
    db.raw.exec(`
      INSERT INTO meals VALUES ('m1','Stew','dinner',40,2,'file:///old/install/Documents/meal-photos/x.jpg','','');
      INSERT INTO calendar_entries VALUES ('e1','2026-09-21','dinner','m1',2,0,NULL,0);
      INSERT INTO calendar_entries VALUES ('e2','2026-09-22','lunch','m1',1,1,'e1',0);
      INSERT INTO calendar_entries VALUES ('orphan','2026-09-22','dinner','deleted-meal',1,0,NULL,0);
      INSERT INTO user_settings (id) VALUES (1);
    `);

    await runMigrations(db);

    const ids = (await db.getAllAsync<{ id: string }>('SELECT id FROM calendar_entries ORDER BY id')).map((r) => r.id);
    expect(ids).toEqual(['e1', 'e2']);
    const meal = await db.getFirstAsync<{ photo_uri: string }>(`SELECT photo_uri FROM meals WHERE id = 'm1'`);
    expect(meal?.photo_uri).toBe('meal-photos/x.jpg');
    const settings = await db.getFirstAsync<{ onboarded_at: string | null }>('SELECT onboarded_at FROM user_settings');
    expect(settings?.onboarded_at).toBeNull();
  });

  it('upgrades a v2 shopping list: carbs become grains, new categories are allowed', async () => {
    const db = createFakeDb();
    await runMigrations(db, migrations.slice(0, 2));
    db.raw.exec(`
      INSERT INTO shopping_list_items VALUES ('s1','Rice','carbs',200,'g',1,'2026-09-21');
      INSERT INTO shopping_list_items VALUES ('s2','Chicken','proteins',400,'g',0,'2026-09-21');
    `);

    await runMigrations(db);

    const rows = await db.getAllAsync<{ id: string; category: string; checked: number }>(
      'SELECT id, category, checked FROM shopping_list_items ORDER BY id'
    );
    expect(rows).toEqual([
      { id: 's1', category: 'grains', checked: 1 },
      { id: 's2', category: 'proteins', checked: 0 },
    ]);
    await expect(
      db.execAsync(`INSERT INTO shopping_list_items VALUES ('s3','Paprika','spices',1,'tsp',0,'2026-09-21')`)
    ).resolves.toBeUndefined();
  });

  it('rolls back a failing migration and leaves the version unchanged', async () => {
    const db = createFakeDb();
    await runMigrations(db, migrations.slice(0, 1));
    await expect(
      runMigrations(db, [...migrations.slice(0, 1), { version: 2, sql: 'CREATE TABLE ok (x); SELECT * FROM nope;' }])
    ).rejects.toThrow();
    expect((await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(1);
    expect(await db.getFirstAsync(`SELECT name FROM sqlite_master WHERE name = 'ok'`)).toBeNull();
  });
});

describe('mealsRepo', () => {
  it('stores photos relative to the documents dir and resolves them on read', async () => {
    const meal = await mealsRepo.create(chicken);
    const db = await getDb();
    const row = await db.getFirstAsync<{ photo_uri: string }>('SELECT photo_uri FROM meals WHERE id = ?', [meal.id]);
    expect(row?.photo_uri).toBe('meal-photos/abc.jpg');
    expect((await mealsRepo.getById(meal.id))?.photoUri).toBe('file:///docs/meal-photos/abc.jpg');
  });

  it('loads ingredients for many meals in one call', async () => {
    const a = await mealsRepo.create(chicken);
    const b = await mealsRepo.create({ ...chicken, name: 'Rice', ingredients: [] });
    const result = await mealsRepo.getIngredientsForMeals([a.id, b.id]);
    expect(result[a.id].map((i) => i.name)).toEqual(['Chicken breast']);
    expect(result[b.id]).toEqual([]);
  });

  it('saves and loads ingredient categories, with null meaning auto', async () => {
    const meal = await mealsRepo.create({
      ...chicken,
      ingredients: [
        { name: 'Chicken breast', quantity: 400, unit: 'g' },
        { name: 'Blue Band', quantity: 1, unit: 'pack', category: 'dairy' },
      ],
    });
    const byName = Object.fromEntries((await mealsRepo.getIngredients(meal.id)).map((i) => [i.name, i.category]));
    expect(byName).toEqual({ 'Chicken breast': null, 'Blue Band': 'dairy' });

    await mealsRepo.update(meal.id, { ingredients: [{ name: 'Blue Band', quantity: 1, unit: 'pack', category: null }] });
    expect((await mealsRepo.getIngredientsForMeals([meal.id]))[meal.id][0].category).toBeNull();
  });

  it('rejects an unknown ingredient category at the database level', async () => {
    const db = await getDb();
    const meal = await mealsRepo.create(chicken);
    await expect(
      db.runAsync(`INSERT INTO meal_ingredients (id, meal_id, name, quantity, unit, category) VALUES ('x', ?, 'X', 1, 'g', 'carbs')`, [
        meal.id,
      ])
    ).rejects.toThrow();
  });

  it('deleting a meal cascades to its ingredients and calendar entries', async () => {
    const meal = await mealsRepo.create(chicken);
    await calendarRepo.create({ date: '2026-09-21', slot: 'dinner', mealId: meal.id, servingsUsed: 2, isLeftover: false, sourceEntryId: null, eaten: false });

    await mealsRepo.delete(meal.id);

    expect(await calendarRepo.listByDate('2026-09-21')).toEqual([]);
    expect(await mealsRepo.getIngredients(meal.id)).toEqual([]);
  });
});

describe('calendarRepo', () => {
  let mealId: string;
  beforeEach(async () => {
    mealId = (await mealsRepo.create(chicken)).id;
  });

  const plan = (): CalendarEntry[] => [
    // Deliberately out of order: the leftover comes before its source dinner.
    entry({ id: 'lunch-2', mealId, date: '2026-09-22', slot: 'lunch', isLeftover: true, sourceEntryId: 'dinner-1' }),
    entry({ id: 'dinner-1', mealId, date: '2026-09-21', servingsUsed: 2 }),
  ];

  it('replaceRange saves a plan and joins each entry with its meal', async () => {
    await calendarRepo.replaceRange('2026-09-21', '2026-09-22', plan());
    const entries = await calendarRepo.listByDateRange('2026-09-21', '2026-09-22');
    expect(entries.map((e) => e.id)).toEqual(['dinner-1', 'lunch-2']);
    expect(entries[0].meal.name).toBe('Chicken');
    expect(entries[0].meal.photoUri).toBe('file:///docs/meal-photos/abc.jpg');
    expect(entries[1].sourceEntryId).toBe('dinner-1');
  });

  it('regenerating replaces the range instead of duplicating it', async () => {
    await calendarRepo.replaceRange('2026-09-21', '2026-09-22', plan());
    await calendarRepo.replaceRange('2026-09-21', '2026-09-22', [entry({ id: 'new', mealId, date: '2026-09-21' })]);
    const entries = await calendarRepo.listByDateRange('2026-09-21', '2026-09-22');
    expect(entries.map((e) => e.id)).toEqual(['new']);
  });

  it('replaceRange is atomic: a failure leaves the old plan untouched', async () => {
    await calendarRepo.replaceRange('2026-09-21', '2026-09-22', plan());
    const bad = [entry({ id: 'ok', mealId, date: '2026-09-21' }), entry({ id: 'bad', mealId: 'no-such-meal', date: '2026-09-22' })];

    await expect(calendarRepo.replaceRange('2026-09-21', '2026-09-22', bad)).rejects.toThrow();

    const entries = await calendarRepo.listByDateRange('2026-09-21', '2026-09-22');
    expect(entries.map((e) => e.id)).toEqual(['dinner-1', 'lunch-2']);
  });

  it("replaceSlot swaps one slot's meal, dropping the old dinner's leftover, and leaves other slots alone", async () => {
    await calendarRepo.replaceRange('2026-09-21', '2026-09-22', [
      ...plan(),
      entry({ id: 'breakfast-1', mealId, date: '2026-09-21', slot: 'breakfast' }),
    ]);
    const other = (await mealsRepo.create({ ...chicken, name: 'Fish' })).id;

    await calendarRepo.replaceSlot('2026-09-21', 'dinner', [entry({ id: 'dinner-new', mealId: other, date: '2026-09-21' })]);

    const entries = await calendarRepo.listByDateRange('2026-09-21', '2026-09-22');
    expect(entries.map((e) => e.id).sort()).toEqual(['breakfast-1', 'dinner-new']);
  });

  it('deleting a dinner also deletes the leftover lunch made from it', async () => {
    await calendarRepo.replaceRange('2026-09-21', '2026-09-22', plan());
    await calendarRepo.delete('dinner-1');
    expect(await calendarRepo.listByDateRange('2026-09-21', '2026-09-22')).toEqual([]);
  });
});

describe('settingsRepo onboarding', () => {
  it('is not onboarded until completeOnboarding runs', async () => {
    expect(await settingsRepo.hasCompletedOnboarding()).toBe(false);
    await settingsRepo.completeOnboarding({ proteinTargetG: 150, leftoverLunchEnabled: false, planDays: 5, varietyPreference: 'balanced' });
    expect(await settingsRepo.hasCompletedOnboarding()).toBe(true);
    expect((await settingsRepo.get()).proteinTargetG).toBe(150);
  });
});
