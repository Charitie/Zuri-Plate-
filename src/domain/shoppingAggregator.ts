import { CalendarEntryWithMeal, MealIngredient, ShoppingCategory, ShoppingListItem } from '@/data/types';

// Simple keyword-based categorizer. Good enough for V1's Kenyan-staples
// focus (English + common Swahili names); swap for a per-ingredient category
// field on MealIngredient later if this starts misclassifying too often.
//
// Keywords match at the start of a word, and the LONGEST matching keyword wins,
// so multi-word keywords disambiguate: "bell pepper" (vegetables) beats "pepper"
// (spices), "green beans" beats "beans", "peanut butter" beats "butter",
// "tomato paste" beats "tomato". Ties go to the earlier category.
const CATEGORY_KEYWORDS: Record<Exclude<ShoppingCategory, 'other'>, string[]> = {
  proteins: [
    'chicken', 'kuku', 'fish', 'tilapia', 'omena', 'tuna', 'sardine', 'egg', 'beef', 'steak', 'nyama',
    'goat', 'mbuzi', 'mutton', 'lamb', 'pork', 'bacon', 'sausage', 'mince', 'liver', 'meat',
    'beans', 'maharagwe', 'lentil', 'kamande', 'ndengu', 'green grams', 'chickpea', 'njahi',
    'tofu', 'soya', 'peanut', 'groundnut', 'njugu', 'peanut butter',
  ],
  dairy: ['milk', 'maziwa', 'mala', 'yogurt', 'yoghurt', 'cheese', 'butter', 'cream', 'ghee'],
  grains: [
    'rice', 'mchele', 'ugali', 'unga', 'flour', 'maize', 'corn', 'oats', 'wimbi', 'millet', 'sorghum',
    'mtama', 'wheat', 'barley', 'quinoa', 'couscous', 'cereal', 'cornflakes', 'weetabix', 'muesli',
    'granola', 'bread', 'chapati', 'pasta', 'spaghetti', 'macaroni', 'noodle',
  ],
  vegetables: [
    'vegetable', 'sukuma', 'kale', 'managu', 'terere', 'amaranth', 'kunde', 'spinach', 'cabbage', 'lettuce',
    'tomato', 'onion', 'kitunguu', 'spring onion', 'carrot', 'bell pepper', 'green pepper', 'red pepper',
    'yellow pepper', 'capsicum', 'pilipili hoho', 'eggplant', 'brinjal', 'aubergine', 'courgette',
    'zucchini', 'cucumber', 'broccoli', 'cauliflower', 'green beans', 'french beans', 'peas', 'mushroom',
    'pumpkin', 'butternut', 'potato', 'sweet potato', 'cassava', 'nduma', 'arrowroot', 'yam', 'matoke',
    'plantain', 'beetroot', 'celery', 'leek', 'okra',
  ],
  fruits: [
    'fruit', 'banana', 'ndizi', 'apple', 'orange', 'mango', 'pineapple', 'pawpaw', 'papaya', 'avocado',
    'watermelon', 'melon', 'passion', 'lemon', 'lime', 'grape', 'berry', 'berries', 'guava', 'pear',
    'peach', 'plum', 'kiwi', 'dates', 'raisin', 'coconut',
  ],
  spices: [
    'spice', 'salt', 'pepper', 'black pepper', 'white pepper', 'peppercorn', 'paprika', 'chilli', 'chili',
    'pilipili', 'cayenne', 'cumin', 'jeera', 'turmeric', 'curry', 'masala', 'cinnamon', 'mdalasini',
    'cardamom', 'iliki', 'cloves', 'nutmeg', 'ginger', 'tangawizi', 'garlic', 'kitunguu saumu',
    'coriander', 'dhania', 'cilantro', 'parsley', 'basil', 'thyme', 'rosemary', 'oregano', 'mint',
    'bay leaf', 'bay leaves', 'herb', 'seasoning', 'stock cube', 'royco',
  ],
  pantry: [
    'oil', 'cooking oil', 'olive oil', 'sugar', 'honey', 'jam', 'vinegar', 'sauce', 'soy sauce',
    'ketchup', 'mayonnaise', 'mustard', 'tomato paste', 'tomato sauce', 'coconut milk', 'baking powder', 'baking soda',
    'yeast', 'stock', 'tea leaves', 'chai', 'coffee', 'cocoa',
  ],
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Precompiled once: [category, keyword length, word-start regex].
const MATCHERS = (Object.entries(CATEGORY_KEYWORDS) as [ShoppingCategory, string[]][]).flatMap(([category, kws]) =>
  kws.map((kw) => [category, kw.length, new RegExp(`(^|[^a-z])${escapeRegex(kw)}`)] as const)
);

export function categorize(ingredientName: string): ShoppingCategory {
  const lower = ingredientName.toLowerCase();
  let best: ShoppingCategory = 'other';
  let bestLength = 0;
  for (const [category, length, regex] of MATCHERS) {
    if (length > bestLength && regex.test(lower)) {
      best = category;
      bestLength = length;
    }
  }
  return best;
}

export interface AggregatorInput {
  entries: CalendarEntryWithMeal[];
  /** ingredients for every meal referenced by `entries`, keyed by mealId */
  ingredientsByMealId: Record<string, MealIngredient[]>;
}

type AggregatedItem = Omit<ShoppingListItem, 'id' | 'checked' | 'listGeneratedAt'>;

/**
 * Aggregates ingredient quantities across a set of calendar entries,
 * scaling by servings cooked vs the meal's base servings, and merges
 * same-name-and-unit ingredients into one line. Leftovers cook nothing, so
 * they add nothing. Each ingredient's own category is used when set;
 * otherwise it's guessed from its name.
 */
export function aggregateShoppingList(input: AggregatorInput): AggregatedItem[] {
  const merged = new Map<string, AggregatedItem>();
  // Keys whose category was chosen by the user rather than guessed from keywords.
  const userCategorized = new Set<string>();

  for (const entry of input.entries) {
    if (entry.servingsCooked <= 0) continue;
    const ingredients = input.ingredientsByMealId[entry.mealId] ?? [];
    const scale = entry.meal.servings > 0 ? entry.servingsCooked / entry.meal.servings : 1;

    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`;
      const scaledQty = ing.quantity * scale;
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += scaledQty;
        // A user-chosen category beats a keyword guess from another meal's copy.
        if (ing.category && !userCategorized.has(key)) {
          existing.category = ing.category;
          userCategorized.add(key);
        }
      } else {
        merged.set(key, {
          name: ing.name,
          category: ing.category ?? categorize(ing.name),
          quantity: scaledQty,
          unit: ing.unit,
        });
        if (ing.category) userCategorized.add(key);
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
