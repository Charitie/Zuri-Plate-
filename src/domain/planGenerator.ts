import { Meal, CalendarEntry, MealType, UserSettings } from '@/data/types';
import { addDaysIso } from '@/services/dateService';
import { buildLeftoverLunch } from './leftoverLinker';

export interface PlanGeneratorInput {
  startDate: string; // YYYY-MM-DD
  settings: UserSettings;
  mealsByType: Record<MealType, Meal[]>;
  /** Meals used in the previous week, to steer away from exact repeats. */
  recentlyUsedMealIds?: Set<string>;
  /**
   * The dinner already on the calendar the day before `startDate`, if any. Its
   * leftovers become the first day's lunch, and it won't be cooked again that night.
   */
  previousDinner?: CalendarEntry | null;
  /** Id factory for new entries. Injected so this module stays free of native deps. */
  newId: () => string;
  /** Returns a float in [0, 1). Defaults to Math.random; inject a seeded one in tests. */
  random?: () => number;
}

/**
 * Deterministic-given-`random` heuristic weekly plan generator (V1 — no ML).
 *
 * For each day:
 *  - picks breakfast / snack / dinner from the library, preferring meals
 *    not yet used this week (falls back to reuse if the pool is small)
 *  - if leftoverLunchEnabled and the previous day's dinner had extra
 *    servings, lunch is that leftover, linked to the dinner by id
 *  - otherwise picks a lunch from the library the same way as other slots
 *  - never serves the previous day's dinner again, so a dish eaten at dinner and
 *    finished as leftover lunch doesn't carry over into another dinner/lunch. If
 *    the library has no other dinner, that day's dinner is left empty.
 *
 * Entries come back with final ids, so they can be persisted as-is.
 */
export function generateWeeklyPlan(input: PlanGeneratorInput): CalendarEntry[] {
  const { startDate, settings, mealsByType, newId, random = Math.random } = input;
  const usedThisWeek = new Set<string>(input.recentlyUsedMealIds ?? []);
  const entries: CalendarEntry[] = [];
  let previousDinner: CalendarEntry | null = input.previousDinner ?? null;
  if (previousDinner) usedThisWeek.add(previousDinner.mealId);

  const pick = (pool: Meal[]) => pickMeal(pool, usedThisWeek, random);
  // Eats one serving; cooks `servingsCooked` (more than one only for a dinner that makes leftovers).
  const makeEntry = (date: string, slot: MealType, meal: Meal, servingsCooked = 1): CalendarEntry => {
    usedThisWeek.add(meal.id);
    return {
      id: newId(),
      date,
      slot,
      mealId: meal.id,
      servingsUsed: 1,
      servingsCooked,
      isLeftover: false,
      sourceEntryId: null,
      eaten: false,
    };
  };

  for (let dayIndex = 0; dayIndex < settings.planDays; dayIndex++) {
    const date = addDaysIso(startDate, dayIndex);

    const breakfast = pick(mealsByType.breakfast);
    const snack = pick(mealsByType.snack);
    const lastDinnerMealId = previousDinner?.mealId;
    const dinner = pick(mealsByType.dinner.filter((m) => m.id !== lastDinnerMealId));

    if (breakfast) entries.push(makeEntry(date, 'breakfast', breakfast));
    if (snack) entries.push(makeEntry(date, 'snack', snack));

    const leftover = settings.leftoverLunchEnabled && previousDinner ? buildLeftoverLunch(previousDinner) : null;
    if (leftover) {
      entries.push({ id: newId(), ...leftover });
    } else {
      const lunch = pick(mealsByType.lunch);
      if (lunch) entries.push(makeEntry(date, 'lunch', lunch));
    }

    // With leftovers on, cook the whole recipe: the rest feeds tomorrow's lunch (on the
    // last day, the first lunch of the next plan). With them off, cook just one serving.
    previousDinner = dinner
      ? makeEntry(date, 'dinner', dinner, settings.leftoverLunchEnabled ? dinner.servings : 1)
      : null;
    if (previousDinner) entries.push(previousDinner);
  }

  return entries;
}

/** Prefers a meal not yet used this week; falls back to any meal in the pool. */
function pickMeal(pool: Meal[], usedThisWeek: Set<string>, random: () => number): Meal | null {
  if (pool.length === 0) return null;
  const unused = pool.filter((m) => !usedThisWeek.has(m.id));
  const candidates = unused.length > 0 ? unused : pool;
  return candidates[Math.floor(random() * candidates.length)];
}
