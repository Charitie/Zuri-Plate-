import { aggregateShoppingList, categorize } from '@/domain/shoppingAggregator';
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
    { id: 'i1', mealId: 'meal-1', name: 'Chicken', quantity: 400, unit: 'g', category: null },
    { id: 'i2', mealId: 'meal-1', name: 'Rice', quantity: 200, unit: 'g', category: null },
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
    expect(result.find((r) => r.name === 'Rice')?.category).toBe('grains');
  });

  it("uses an ingredient's own category over the keyword guess", () => {
    const result = aggregateShoppingList({
      entries: [makeEntry({})],
      ingredientsByMealId: {
        'meal-1': [{ id: 'i1', mealId: 'meal-1', name: 'Blue Band', quantity: 1, unit: 'pack', category: 'dairy' }],
      },
    });
    expect(result[0].category).toBe('dairy');
  });

  it('a user-chosen category wins when merging with an auto-categorized copy from another meal', () => {
    const auto = makeEntry({ id: 'a', mealId: 'meal-1' });
    const chosen = makeEntry({ id: 'b', mealId: 'meal-2' });
    const result = aggregateShoppingList({
      entries: [auto, chosen],
      ingredientsByMealId: {
        'meal-1': [{ id: 'i1', mealId: 'meal-1', name: 'Avocado', quantity: 1, unit: 'piece', category: null }],
        'meal-2': [{ id: 'i2', mealId: 'meal-2', name: 'avocado', quantity: 1, unit: 'piece', category: 'vegetables' }],
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('vegetables');
    expect(result[0].quantity).toBe(2);
  });
});

describe('categorize', () => {
  it.each([
    ['Oats', 'grains'],
    ['Unga wa ugali', 'grains'],
    ['Paprika', 'spices'],
    ['Black pepper', 'spices'],
    ['Pilau masala', 'spices'],
    ['Garlic cloves', 'spices'],
    ['Bananas', 'fruits'],
    ['Avocado', 'fruits'],
    ['Mala', 'dairy'],
    ['Cooking oil', 'pantry'],
    ['Sukuma wiki', 'vegetables'],
    ['Potatoes', 'vegetables'],
    ['Eggs', 'proteins'],
    ['Something unusual', 'other'],
  ])('%s -> %s', (name, category) => {
    expect(categorize(name)).toBe(category);
  });

  it.each([
    ['Bell pepper', 'vegetables'], // not the spice "pepper"
    ['Green beans', 'vegetables'], // not the protein "beans"
    ['Eggplant', 'vegetables'], // not "egg"
    ['Peanut butter', 'proteins'], // not dairy "butter"
    ['Butternut', 'vegetables'], // not "butter"
    ['Tomato paste', 'pantry'], // not the vegetable
    ['Coconut milk', 'pantry'], // not fruit or dairy
    ['Peppercorns', 'spices'], // not grains "corn"
    ['Boiled eggs', 'proteins'], // "oil" only matches at a word start
  ])('disambiguates %s -> %s', (name, category) => {
    expect(categorize(name)).toBe(category);
  });
});
