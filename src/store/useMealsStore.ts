import { create } from 'zustand';
import { Meal, NewMealInput } from '@/data/types';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { deleteMealPhoto } from '@/services/imageService';
import { errorMessage } from '@/services/errors';
import { useCalendarStore } from './useCalendarStore';

interface MealsState {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  loadAll: () => Promise<void>;
  addMeal: (input: NewMealInput) => Promise<Meal>;
  updateMeal: (id: string, patch: Partial<NewMealInput>) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
}

export const useMealsStore = create<MealsState>((set, get) => ({
  meals: [],
  loading: false,
  error: null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      set({ meals: await mealsRepo.listAll() });
    } catch (e) {
      set({ error: errorMessage(e) });
    } finally {
      set({ loading: false });
    }
  },

  addMeal: async (input) => {
    const meal = await mealsRepo.create(input);
    set({ meals: [...get().meals, meal].sort((a, b) => a.name.localeCompare(b.name)) });
    return meal;
  },

  updateMeal: async (id, patch) => {
    const before = get().meals.find((m) => m.id === id) ?? (await mealsRepo.getById(id));
    await mealsRepo.update(id, patch);
    // The old photo file is unreferenced once the row points at a new one.
    if (patch.photoUri !== undefined && before?.photoUri && before.photoUri !== patch.photoUri) {
      await deleteMealPhoto(before.photoUri).catch(console.warn);
    }
    await get().loadAll();
  },

  removeMeal: async (id) => {
    const meal = get().meals.find((m) => m.id === id) ?? (await mealsRepo.getById(id));
    await mealsRepo.delete(id); // cascades to ingredients + calendar entries
    set({ meals: get().meals.filter((m) => m.id !== id) });
    useCalendarStore.getState().forgetMeal(id);
    if (meal?.photoUri) await deleteMealPhoto(meal.photoUri).catch(console.warn);
  },
}));
