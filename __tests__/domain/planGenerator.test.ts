import { generateWeeklyPlan } from '@/domain/planGenerator';
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
    dinner: [makeMeal({ type: 'dinner', name: 'Chicken', servings: 2 })],
    snack: [makeMeal({ type: 'snack', name: 'Mala' })],
  };

  it('generates one entry per slot per day when meals are available', () => {
    const plan = generateWeeklyPlan({ startDate: '2026-09-21', settings, mealsByType });
    const days = new Set(plan.map((e) => e.date));
    expect(days.size).toBe(3);
    // breakfast + snack + dinner + lunch = 4 per day (lunch may be a leftover)
    expect(plan.length).toBe(12);
  });

  it('marks lunch as a leftover linked to the previous dinner when enabled', () => {
    const plan = generateWeeklyPlan({ startDate: '2026-09-21', settings, mealsByType });
    const secondDayLunch = plan.find((e) => e.date === '2026-09-22' && e.slot === 'lunch');
    expect(secondDayLunch?.isLeftover).toBe(true);
  });

  it('does not mark the first day lunch as leftover (no prior dinner yet)', () => {
    const plan = generateWeeklyPlan({ startDate: '2026-09-21', settings, mealsByType });
    const firstDayLunch = plan.find((e) => e.date === '2026-09-21' && e.slot === 'lunch');
    expect(firstDayLunch?.isLeftover).toBe(false);
  });

  it('produces fresh lunches every day when leftovers are disabled', () => {
    const plan = generateWeeklyPlan({
      startDate: '2026-09-21',
      settings: { ...settings, leftoverLunchEnabled: false },
      mealsByType,
    });
    const lunches = plan.filter((e) => e.slot === 'lunch');
    expect(lunches.every((l) => !l.isLeftover)).toBe(true);
  });
});
