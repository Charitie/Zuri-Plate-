import { create } from 'zustand';
import { Meal, NewMealInput } from '@/data/types';
import { mealsRepo } from '@/data/repositories/mealsRepo';

interface MealsState {
  meals: Meal[];
  loading: boolean;
  loadAll: () => Promise<void>;
  addMeal: (input: NewMealInput) => Promise<Meal>;
  updateMeal: (id: string, patch: Partial<NewMealInput>) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
}

export const useMealsStore = create<MealsState>((set, get) => ({
  meals: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true });
    const meals = await mealsRepo.listAll();
    set({ meals, loading: false });
  },

  addMeal: async (input) => {
    const meal = await mealsRepo.create(input);
    set({ meals: [...get().meals, meal] });
    return meal;
  },

  updateMeal: async (id, patch) => {
    await mealsRepo.update(id, patch);
    await get().loadAll();
  },

  removeMeal: async (id) => {
    await mealsRepo.delete(id);
    set({ meals: get().meals.filter((m) => m.id !== id) });
  },
}));
