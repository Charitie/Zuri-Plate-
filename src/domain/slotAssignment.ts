import { CalendarEntry, Meal, MealType } from '@/data/types';
import { buildLeftoverLunch } from './leftoverLinker';

export interface SlotAssignmentInput {
  date: string;
  slot: MealType;
  meal: Meal;
  leftoverLunchEnabled: boolean;
  /** False when the next day's lunch already has something planned (that isn't being replaced). */
  nextDayLunchFree: boolean;
  newId: () => string;
}

/**
 * Entries to save when the user puts one meal into one slot by hand.
 *
 * Mirrors the plan generator's leftover rule: a dinner that makes more than one
 * serving is cooked in full, and the rest becomes the next day's lunch — but
 * only if leftovers are on and that lunch is free. Otherwise it's 1 serving.
 */
export function buildSlotEntries(input: SlotAssignmentInput): CalendarEntry[] {
  const { date, slot, meal, leftoverLunchEnabled, nextDayLunchFree, newId } = input;
  const makesLeftovers = slot === 'dinner' && leftoverLunchEnabled && nextDayLunchFree && meal.servings > 1;

  const entry: CalendarEntry = {
    id: newId(),
    date,
    slot,
    mealId: meal.id,
    servingsUsed: 1,
    servingsCooked: makesLeftovers ? meal.servings : 1,
    isLeftover: false,
    sourceEntryId: null,
    eaten: false,
  };

  const leftover = makesLeftovers ? buildLeftoverLunch(entry) : null;
  return leftover ? [entry, { id: newId(), ...leftover }] : [entry];
}
