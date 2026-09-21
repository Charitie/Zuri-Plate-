import { Meal, CalendarEntry, MealType, UserSettings } from '@/data/types';
import { addDaysIso } from '@/services/dateService';
import { buildLeftoverLunch } from './leftoverLinker';

export interface PlanGeneratorInput {
  startDate: string; // YYYY-MM-DD
  settings: UserSettings;
  mealsByType: Record<MealType, Meal[]>;
  /** Meals used in the previous week, to steer away from exact repeats. */
  recentlyUsedMealIds?: Set<string>;
}

export interface GeneratedEntry extends Omit<CalendarEntry, 'id'> {}

/**
 * Deterministic heuristic weekly plan generator (V1 — no ML).
 *
 * For each day:
 *  - picks breakfast / snack / dinner from the library, preferring meals
 *    not yet used this week (falls back to reuse if the pool is small)
 *  - if leftoverLunchEnabled and the previous day's dinner had extra
 *    servings, lunch is auto-filled from that leftover
 *  - otherwise picks a lunch from the library the same way as other slots
 */
export function generateWeeklyPlan(input: PlanGeneratorInput): GeneratedEntry[] {
  const { startDate, settings, mealsByType } = input;
  const usedThisWeek = new Set<string>(input.recentlyUsedMealIds ?? []);
  const entries: GeneratedEntry[] = [];

  // Track dinners as we go so lunch can reference yesterday's dinner entry.
  let previousDinner: GeneratedEntry | null = null;
  let previousDinnerId: string | null = null; // filled in by caller after insert; see note below

  for (let dayIndex = 0; dayIndex < settings.planDays; dayIndex++) {
    const date = addDaysIso(startDate, dayIndex);

    const breakfast = pickMeal(mealsByType.breakfast, usedThisWeek);
    const snack = pickMeal(mealsByType.snack, usedThisWeek);
    const dinner = pickMeal(mealsByType.dinner, usedThisWeek);

    if (breakfast) entries.push(makeEntry(date, 'breakfast', breakfast, usedThisWeek));
    if (snack) entries.push(makeEntry(date, 'snack', snack, usedThisWeek));

    // Lunch: leftover from yesterday's dinner if enabled and available,
    // otherwise pick a fresh lunch meal.
    let lunchEntry: GeneratedEntry | null = null;
    if (settings.leftoverLunchEnabled && previousDinner && previousDinner.servingsUsed > 1) {
      // NOTE: sourceEntryId is a real calendar_entries.id, which only exists
      // once the previous day's dinner has been persisted. The app layer
      // (planWizard controller) should insert entries day-by-day and patch
      // sourceEntryId in using the real id — see docs in PlanWizardScreen.
      lunchEntry = {
        date,
        slot: 'lunch',
        mealId: previousDinner.mealId,
        servingsUsed: previousDinner.servingsUsed - 1,
        isLeftover: true,
        sourceEntryId: previousDinnerId, // placeholder, patched by caller
        eaten: false,
      };
    } else {
      const lunch = pickMeal(mealsByType.lunch, usedThisWeek);
      if (lunch) lunchEntry = makeEntry(date, 'lunch', lunch, usedThisWeek);
    }
    if (lunchEntry) entries.push(lunchEntry);

    if (dinner) {
      const dinnerEntry = makeEntry(date, 'dinner', dinner, usedThisWeek, dinner.servings);
      entries.push(dinnerEntry);
      previousDinner = dinnerEntry;
    } else {
      previousDinner = null;
    }
  }

  return entries;
}

function makeEntry(
  date: string,
  slot: MealType,
  meal: Meal,
  usedThisWeek: Set<string>,
  servingsUsed = 1
): GeneratedEntry {
  usedThisWeek.add(meal.id);
  return {
    date,
    slot,
    mealId: meal.id,
    servingsUsed,
    isLeftover: false,
    sourceEntryId: null,
    eaten: false,
  };
}

/** Prefers a meal not yet used this week; falls back to any meal in the pool. */
function pickMeal(pool: Meal[], usedThisWeek: Set<string>): Meal | null {
  if (pool.length === 0) return null;
  const unused = pool.filter((m) => !usedThisWeek.has(m.id));
  const candidates = unused.length > 0 ? unused : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
