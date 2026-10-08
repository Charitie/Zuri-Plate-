import { dailyProteinTotal, entryProtein } from '@/domain/proteinCalculator';
import { buildSlotEntries } from '@/domain/slotAssignment';
import { CalendarEntryWithMeal, Meal } from '@/data/types';

const stew: Meal = {
  id: 'stew',
  name: 'Beef stew',
  type: 'dinner',
  proteinG: 120,
  servings: 4,
  photoUri: null,
  createdAt: '',
  updatedAt: '',
};

function counterIds() {
  let n = 0;
  return () => `id-${++n}`;
}

describe('protein with leftovers', () => {
  const [dinner, leftover]: CalendarEntryWithMeal[] = buildSlotEntries({
    date: '2026-10-01',
    slot: 'dinner',
    meal: stew,
    leftoverLunchEnabled: true,
    nextDayLunchFree: true,
    newId: counterIds(),
  }).map((e) => ({ ...e, meal: stew }));

  it('counts only the serving eaten at dinner, not the whole pot', () => {
    expect(entryProtein(dinner)).toBe(30);
  });

  it('counts the remaining servings at the leftover lunch', () => {
    expect(entryProtein(leftover)).toBe(90);
  });

  it('never counts more protein than the recipe contains', () => {
    expect(dailyProteinTotal([dinner]) + dailyProteinTotal([leftover])).toBe(stew.proteinG);
  });
});
