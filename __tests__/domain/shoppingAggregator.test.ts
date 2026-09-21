import { aggregateShoppingList } from '@/domain/shoppingAggregator';
import { CalendarEntryWithMeal, MealIngredient } from '@/data/types';

function makeEntry(overrides: Partial<CalendarEntryWithMeal>): CalendarEntryWithMeal {
  return {
    id: 'entry-1',
    date: '2026-09-21',
    slot: 'dinner',
    mealId: 'meal-1',
    servingsUsed: 2,
    isLeftover: false,
    sourceEntryId: null,
    eaten: false,
    meal: {
      id: 'meal-1',
      name: 'Chicken + rice',
      type: 'dinner',
      proteinG: 40,
      servings: 2,
      photoUri: null,
      createdAt: '',
      updatedAt: '',
    },
    ...overrides,
  };
}

describe('aggregateShoppingList', () => {
  const ingredients: MealIngredient[] = [
    { id: 'i1', mealId: 'meal-1', name: 'Chicken', quantity: 400, unit: 'g' },
    { id: 'i2', mealId: 'meal-1', name: 'Rice', quantity: 200, unit: 'g' },
  ];

  it('scales ingredient quantities by servings used vs base servings', () => {
    const entry = makeEntry({ servingsUsed: 1 }); // half the base 2 servings
    const result = aggregateShoppingList({
      entries: [entry],
      ingredientsByMealId: { 'meal-1': ingredients },
    });

    const chicken = result.find((r) => r.name === 'Chicken');
    expect(chicken?.quantity).toBe(200); // 400g * (1/2)
  });

  it('merges the same ingredient across multiple entries', () => {
    const entryA = makeEntry({ id: 'a', date: '2026-09-21' });
    const entryB = makeEntry({ id: 'b', date: '2026-09-23' });
    const result = aggregateShoppingList({
      entries: [entryA, entryB],
      ingredientsByMealId: { 'meal-1': ingredients },
    });

    const chicken = result.find((r) => r.name === 'Chicken');
    expect(chicken?.quantity).toBe(800); // 400g * 1 (2/2 scale) * 2 entries
  });

  it('categorizes known ingredients correctly', () => {
    const result = aggregateShoppingList({
      entries: [makeEntry({})],
      ingredientsByMealId: { 'meal-1': ingredients },
    });
    expect(result.find((r) => r.name === 'Chicken')?.category).toBe('proteins');
    expect(result.find((r) => r.name === 'Rice')?.category).toBe('carbs');
  });
});
