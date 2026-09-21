import { CalendarEntry, MealType } from '@/data/types';
import { addDaysIso } from '@/services/dateService';

/**
 * Given a dinner entry that was cooked with extra servings, returns the
 * calendar entry to insert for the next day's lunch, linked back via
 * sourceEntryId. Returns null if the dinner has nothing left over.
 */
export function buildLeftoverLunch(dinnerEntry: CalendarEntry): Omit<CalendarEntry, 'id'> | null {
  if (dinnerEntry.slot !== 'dinner') return null;
  const leftoverServings = dinnerEntry.servingsUsed - 1; // 1 serving consumed at dinner
  if (leftoverServings <= 0) return null;

  return {
    date: addDaysIso(dinnerEntry.date, 1),
    slot: 'lunch' as MealType,
    mealId: dinnerEntry.mealId,
    servingsUsed: leftoverServings,
    isLeftover: true,
    sourceEntryId: dinnerEntry.id,
    eaten: false,
  };
}
