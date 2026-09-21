import { CalendarEntryWithMeal, MealIngredient, ShoppingCategory, ShoppingListItem } from '@/data/types';

// Simple keyword-based categorizer. Good enough for V1's Kenyan-staples
// focus; swap for a per-ingredient category field on MealIngredient later
// if the list grows and this starts misclassifying too often.
const CATEGORY_KEYWORDS: Record<ShoppingCategory, string[]> = {
  proteins: ['chicken', 'fish', 'egg', 'omena', 'beef', 'beans', 'lentil', 'mala', 'yogurt', 'meat'],
  carbs: ['rice', 'ugali', 'flour', 'potato', 'bread', 'pasta', 'oats'],
  vegetables: ['sukuma', 'managu', 'tomato', 'onion', 'avocado', 'vegetable', 'spinach', 'cabbage'],
  other: [],
};

function categorize(ingredientName: string): ShoppingCategory {
  const lower = ingredientName.toLowerCase();
  for (const category of Object.keys(CATEGORY_KEYWORDS) as ShoppingCategory[]) {
    if (category === 'other') continue;
    if (CATEGORY_KEYWORDS[category].some((kw) => lower.includes(kw))) return category;
  }
  return 'other';
}

export interface AggregatorInput {
  entries: CalendarEntryWithMeal[];
  /** ingredients for every meal referenced by `entries`, keyed by mealId */
  ingredientsByMealId: Record<string, MealIngredient[]>;
}

type AggregatedItem = Omit<ShoppingListItem, 'id' | 'checked' | 'listGeneratedAt'>;

/**
 * Aggregates ingredient quantities across a set of calendar entries,
 * scaling by servingsUsed vs the meal's base servings, and merges
 * same-name-and-unit ingredients into one line.
 */
export function aggregateShoppingList(input: AggregatorInput): AggregatedItem[] {
  const merged = new Map<string, AggregatedItem>();

  for (const entry of input.entries) {
    const ingredients = input.ingredientsByMealId[entry.mealId] ?? [];
    const scale = entry.meal.servings > 0 ? entry.servingsUsed / entry.meal.servings : 1;

    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`;
      const scaledQty = ing.quantity * scale;
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += scaledQty;
      } else {
        merged.set(key, {
          name: ing.name,
          category: categorize(ing.name),
          quantity: scaledQty,
          unit: ing.unit,
        });
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
