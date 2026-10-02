import { ShoppingCategory } from '@/data/types';

// Key order here is also the order categories appear in (shopping list sections, pickers).
export const CATEGORY_LABEL: Record<ShoppingCategory, string> = {
  proteins: 'Proteins',
  dairy: 'Dairy',
  grains: 'Cereals & grains',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  spices: 'Spices & herbs',
  pantry: 'Oils & pantry',
  other: 'Other',
};

export const SHOPPING_CATEGORIES = Object.keys(CATEGORY_LABEL) as ShoppingCategory[];

export const isShoppingCategory = (value: unknown): value is ShoppingCategory =>
  typeof value === 'string' && value in CATEGORY_LABEL;
