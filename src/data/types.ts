export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  proteinG: number;
  servings: number;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealIngredient {
  id: string;
  mealId: string;
  name: string;
  quantity: number;
  unit: string;
  /** User-chosen shopping category; null means "auto" (keyword-based, see shoppingAggregator). */
  category: ShoppingCategory | null;
}

export interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealType;
  mealId: string;
  servingsUsed: number;
  isLeftover: boolean;
  sourceEntryId: string | null;
  eaten: boolean;
}

export interface CalendarEntryWithMeal extends CalendarEntry {
  meal: Meal;
}

export interface UserSettings {
  proteinTargetG: number;
  leftoverLunchEnabled: boolean;
  planDays: number;
  varietyPreference: string;
}

export type ShoppingCategory =
  | 'proteins'
  | 'dairy'
  | 'grains'
  | 'vegetables'
  | 'fruits'
  | 'spices'
  | 'pantry'
  | 'other';

export interface ShoppingListItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: string;
  checked: boolean;
  listGeneratedAt: string;
}

export interface NewMealInput {
  name: string;
  type: MealType;
  proteinG: number;
  servings: number;
  photoUri?: string | null;
  ingredients: { name: string; quantity: number; unit: string; category?: ShoppingCategory | null }[];
}
