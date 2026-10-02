import * as Crypto from 'expo-crypto';
import { UserSettings, MealType, Meal } from '@/data/types';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { calendarRepo } from '@/data/repositories/calendarRepo';
import { generateWeeklyPlan } from '@/domain/planGenerator';
import { buildSlotEntries } from '@/domain/slotAssignment';
import { groupBy } from '@/domain/groupBy';
import { addDaysIso } from './dateService';

export interface SavedPlanRange {
  startDate: string;
  endDate: string;
  entryCount: number;
}

export class EmptyMealLibraryError extends Error {
  constructor() {
    super('Add some meals to your library before generating a plan.');
    this.name = 'EmptyMealLibraryError';
  }
}

/**
 * Puts `meal` into `slot` on `date`, replacing what was there. A dinner with
 * extra servings also fills the next day's lunch with leftovers when that lunch
 * is free. Returns the last date touched, so callers can reload [date, endDate].
 */
export async function addMealToSlot(
  settings: UserSettings,
  date: string,
  slot: MealType,
  meal: Meal
): Promise<{ endDate: string }> {
  const nextDay = addDaysIso(date, 1);
  const existing = await calendarRepo.listByDateRange(date, nextDay);
  const replacedIds = new Set(existing.filter((e) => e.date === date && e.slot === slot).map((e) => e.id));
  // A leftover lunch made from the dinner being replaced goes away with it, so it doesn't count.
  const nextDayLunchFree = !existing.some(
    (e) => e.date === nextDay && e.slot === 'lunch' && !(e.sourceEntryId && replacedIds.has(e.sourceEntryId))
  );

  const entries = buildSlotEntries({
    date,
    slot,
    meal,
    leftoverLunchEnabled: settings.leftoverLunchEnabled,
    nextDayLunchFree,
    newId: Crypto.randomUUID,
  });
  await calendarRepo.replaceSlot(date, slot, entries);
  return { endDate: nextDay };
}

/**
 * Generates a plan starting at `startDate` and saves it, replacing whatever was
 * planned for those days. Atomic: on failure the calendar is unchanged.
 */
export async function generateAndSavePlan(settings: UserSettings, startDate: string): Promise<SavedPlanRange> {
  const [meals, previousDinner] = await Promise.all([
    mealsRepo.listAll(),
    calendarRepo.findDinner(addDaysIso(startDate, -1)),
  ]);
  if (meals.length === 0) throw new EmptyMealLibraryError();

  const grouped = groupBy(meals, (m) => m.type);
  const mealsByType: Record<MealType, Meal[]> = {
    breakfast: grouped.breakfast ?? [],
    lunch: grouped.lunch ?? [],
    dinner: grouped.dinner ?? [],
    snack: grouped.snack ?? [],
  };

  const entries = generateWeeklyPlan({
    startDate,
    settings,
    mealsByType,
    previousDinner,
    newId: Crypto.randomUUID,
  });
  const endDate = addDaysIso(startDate, settings.planDays - 1);
  await calendarRepo.replaceRange(startDate, endDate, entries);
  return { startDate, endDate, entryCount: entries.length };
}
