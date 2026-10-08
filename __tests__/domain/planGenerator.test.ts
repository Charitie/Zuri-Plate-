import { generateWeeklyPlan, PlanGeneratorInput } from '@/domain/planGenerator';
import { Meal, UserSettings } from '@/data/types';

function makeMeal(overrides: Partial<Meal>): Meal {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'Test meal',
    type: 'dinner',
    proteinG: 30,
    servings: 2,
    photoUri: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

/** Small deterministic PRNG (mulberry32) so "random" picks are reproducible. */
function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function counterIds() {
  let n = 0;
  return () => `id-${++n}`;
}

describe('generateWeeklyPlan', () => {
  const settings: UserSettings = {
    proteinTargetG: 120,
    leftoverLunchEnabled: true,
    planDays: 3,
    varietyPreference: 'balanced',
  };

  const mealsByType = {
    breakfast: [makeMeal({ type: 'breakfast', name: 'Eggs' })],
    lunch: [makeMeal({ type: 'lunch', name: 'Beans' })],
    dinner: [
      makeMeal({ type: 'dinner', name: 'Chicken', servings: 2 }),
      makeMeal({ type: 'dinner', name: 'Beef', servings: 2 }),
    ],
    snack: [makeMeal({ type: 'snack', name: 'Mala' })],
  };

  const generate = (overrides: Partial<PlanGeneratorInput> = {}) =>
    generateWeeklyPlan({
      startDate: '2026-09-21',
      settings,
      mealsByType,
      newId: counterIds(),
      random: seededRandom(42),
      ...overrides,
    });

  it('generates one entry per slot per day when meals are available', () => {
    const plan = generate();
    const days = new Set(plan.map((e) => e.date));
    expect(days.size).toBe(3);
    // breakfast + snack + dinner + lunch = 4 per day (lunch may be a leftover)
    expect(plan.length).toBe(12);
  });

  it('gives every entry a unique id', () => {
    const plan = generate();
    expect(new Set(plan.map((e) => e.id)).size).toBe(plan.length);
  });

  it('links a leftover lunch to the actual previous-day dinner entry', () => {
    const plan = generate();
    const day1Dinner = plan.find((e) => e.date === '2026-09-21' && e.slot === 'dinner')!;
    const day2Lunch = plan.find((e) => e.date === '2026-09-22' && e.slot === 'lunch')!;
    expect(day2Lunch.isLeftover).toBe(true);
    expect(day2Lunch.sourceEntryId).toBe(day1Dinner.id);
    expect(day2Lunch.mealId).toBe(day1Dinner.mealId);
    expect(day2Lunch.servingsUsed).toBe(1);
  });

  it('cooks the whole recipe for a leftover-making dinner but eats one serving of it', () => {
    const plan = generate();
    const day1Dinner = plan.find((e) => e.date === '2026-09-21' && e.slot === 'dinner')!;
    const day2Lunch = plan.find((e) => e.date === '2026-09-22' && e.slot === 'lunch')!;
    expect(day1Dinner).toMatchObject({ servingsUsed: 1, servingsCooked: 2 });
    expect(day2Lunch).toMatchObject({ servingsUsed: 1, servingsCooked: 0 });
  });

  it('cooks one serving per dinner when leftovers are disabled', () => {
    const plan = generate({ settings: { ...settings, leftoverLunchEnabled: false } });
    const dinners = plan.filter((e) => e.slot === 'dinner');
    expect(dinners.every((d) => d.servingsUsed === 1 && d.servingsCooked === 1)).toBe(true);
  });

  it('does not mark the first day lunch as leftover (no prior dinner yet)', () => {
    const plan = generate();
    const firstDayLunch = plan.find((e) => e.date === '2026-09-21' && e.slot === 'lunch');
    expect(firstDayLunch?.isLeftover).toBe(false);
  });

  it('produces fresh lunches every day when leftovers are disabled', () => {
    const plan = generate({ settings: { ...settings, leftoverLunchEnabled: false } });
    const lunches = plan.filter((e) => e.slot === 'lunch');
    expect(lunches.every((l) => !l.isLeftover && l.sourceEntryId === null)).toBe(true);
  });

  it('does not create a leftover when the dinner only makes one serving', () => {
    const plan = generate({
      mealsByType: { ...mealsByType, dinner: [makeMeal({ type: 'dinner', servings: 1 })] },
    });
    expect(plan.some((e) => e.isLeftover)).toBe(false);
  });

  it('avoids repeating a meal while unused ones remain', () => {
    const dinners = ['A', 'B', 'C'].map((name) => makeMeal({ type: 'dinner', name, id: name }));
    for (const seed of [1, 2, 3, 42, 1000]) {
      const plan = generate({ mealsByType: { ...mealsByType, dinner: dinners }, random: seededRandom(seed) });
      const dinnerIds = plan.filter((e) => e.slot === 'dinner').map((e) => e.mealId);
      expect(new Set(dinnerIds).size).toBe(3);
    }
  });

  it('never serves the same dinner two days in a row, even once the pool is exhausted', () => {
    const dinners = ['A', 'B'].map((name) => makeMeal({ type: 'dinner', name, id: name, servings: 2 }));
    for (const seed of [1, 2, 3, 42, 1000]) {
      const plan = generate({
        settings: { ...settings, planDays: 7 },
        mealsByType: { ...mealsByType, dinner: dinners },
        random: seededRandom(seed),
      });
      const dinnerIds = plan.filter((e) => e.slot === 'dinner').map((e) => e.mealId);
      expect(dinnerIds).toHaveLength(7);
      dinnerIds.slice(1).forEach((id, i) => expect(id).not.toBe(dinnerIds[i]));
    }
  });

  it('leaves dinner empty rather than repeating the only dinner the night after', () => {
    const only = makeMeal({ type: 'dinner', name: 'Stew', id: 'stew', servings: 2 });
    const plan = generate({ mealsByType: { ...mealsByType, dinner: [only] } });
    const dinnerDates = plan.filter((e) => e.slot === 'dinner').map((e) => e.date);
    expect(dinnerDates).toEqual(['2026-09-21', '2026-09-23']);
    // Day 3 lunch has no dinner the night before, so it's a fresh lunch, not more stew.
    const day3Lunch = plan.find((e) => e.date === '2026-09-23' && e.slot === 'lunch')!;
    expect(day3Lunch.isLeftover).toBe(false);
    expect(day3Lunch.mealId).not.toBe('stew');
  });

  it("uses the dinner before startDate for the first lunch and doesn't cook it again that night", () => {
    const [chicken, beef] = mealsByType.dinner;
    const yesterday = {
      id: 'yesterday-dinner',
      date: '2026-09-20',
      slot: 'dinner' as const,
      mealId: chicken.id,
      servingsUsed: 1,
      servingsCooked: 2,
      isLeftover: false,
      sourceEntryId: null,
      eaten: false,
    };
    const plan = generate({ previousDinner: yesterday });
    const day1Lunch = plan.find((e) => e.date === '2026-09-21' && e.slot === 'lunch')!;
    expect(day1Lunch.isLeftover).toBe(true);
    expect(day1Lunch.sourceEntryId).toBe('yesterday-dinner');
    const day1Dinner = plan.find((e) => e.date === '2026-09-21' && e.slot === 'dinner')!;
    expect(day1Dinner.mealId).toBe(beef.id);
  });

  it('is reproducible for the same seed', () => {
    const dinners = ['A', 'B', 'C', 'D'].map((name) => makeMeal({ type: 'dinner', name, id: name }));
    const run = () =>
      generate({ mealsByType: { ...mealsByType, dinner: dinners }, random: seededRandom(7) }).map((e) => e.mealId);
    expect(run()).toEqual(run());
  });
});
