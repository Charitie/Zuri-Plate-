import { buildSlotEntries, SlotAssignmentInput } from '@/domain/slotAssignment';
import { Meal } from '@/data/types';

const stew: Meal = {
  id: 'stew',
  name: 'Beef stew',
  type: 'dinner',
  proteinG: 90,
  servings: 3,
  photoUri: null,
  createdAt: '',
  updatedAt: '',
};

function counterIds() {
  let n = 0;
  return () => `id-${++n}`;
}

const build = (overrides: Partial<SlotAssignmentInput> = {}) =>
  buildSlotEntries({
    date: '2026-10-01',
    slot: 'dinner',
    meal: stew,
    leftoverLunchEnabled: true,
    nextDayLunchFree: true,
    newId: counterIds(),
    ...overrides,
  });

describe('buildSlotEntries', () => {
  it("cooks a multi-serving dinner in full and puts the rest in tomorrow's lunch", () => {
    const [dinner, lunch] = build();
    expect(dinner).toMatchObject({ date: '2026-10-01', slot: 'dinner', servingsUsed: 3, isLeftover: false });
    expect(lunch).toMatchObject({
      date: '2026-10-02',
      slot: 'lunch',
      mealId: 'stew',
      servingsUsed: 2,
      isLeftover: true,
      sourceEntryId: dinner.id,
    });
  });

  it.each([
    ['leftovers are off', { leftoverLunchEnabled: false }],
    ["tomorrow's lunch is taken", { nextDayLunchFree: false }],
    ['the recipe makes one serving', { meal: { ...stew, servings: 1 } }],
    ['the slot is not dinner', { slot: 'lunch' as const }],
  ])('adds just one serving with no leftover when %s', (_, overrides) => {
    const entries = build(overrides);
    expect(entries).toHaveLength(1);
    expect(entries[0].servingsUsed).toBe(1);
  });
});
