import { create } from 'zustand';
import { CalendarEntryWithMeal } from '@/data/types';
import { calendarRepo } from '@/data/repositories/calendarRepo';
import { groupBy } from '@/domain/groupBy';
import { errorMessage } from '@/services/errors';

/**
 * Shared empty result for selectors. `s.entriesByDate[d] ?? []` would create a
 * new array on every call, which breaks memoization and makes Zustand v5 loop.
 */
export const EMPTY_ENTRIES: readonly CalendarEntryWithMeal[] = Object.freeze([]);

/** Finds a loaded entry by id, across all cached days. */
export function findEntry(state: Pick<CalendarState, 'entriesByDate'>, entryId: string): CalendarEntryWithMeal | undefined {
  for (const entries of Object.values(state.entriesByDate)) {
    const match = entries.find((e) => e.id === entryId);
    if (match) return match;
  }
  return undefined;
}

interface CalendarState {
  entriesByDate: Record<string, CalendarEntryWithMeal[]>;
  loading: boolean;
  error: string | null;
  /** Reloads [startDate, endDate]; days in the range that are now empty are cleared. */
  loadRange: (startDate: string, endDate: string) => Promise<void>;
  markEaten: (entryId: string, eaten: boolean) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  /** Drops cached entries for a meal that was deleted (the DB already cascaded). */
  forgetMeal: (mealId: string) => void;
}

function mapEntries(
  byDate: Record<string, CalendarEntryWithMeal[]>,
  fn: (entries: CalendarEntryWithMeal[]) => CalendarEntryWithMeal[]
): Record<string, CalendarEntryWithMeal[]> {
  return Object.fromEntries(Object.entries(byDate).map(([date, entries]) => [date, fn(entries)]));
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  entriesByDate: {},
  loading: false,
  error: null,

  loadRange: async (startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const entries = await calendarRepo.listByDateRange(startDate, endDate);
      const outsideRange = Object.fromEntries(
        Object.entries(get().entriesByDate).filter(([date]) => date < startDate || date > endDate)
      );
      set({ entriesByDate: { ...outsideRange, ...groupBy(entries, (e) => e.date) } });
    } catch (e) {
      set({ error: errorMessage(e) });
    } finally {
      set({ loading: false });
    }
  },

  // Mutations write to the DB first and only update state on success;
  // errors propagate so the screen that triggered them can tell the user.
  markEaten: async (entryId, eaten) => {
    await calendarRepo.update(entryId, { eaten });
    set({ entriesByDate: mapEntries(get().entriesByDate, (es) => es.map((e) => (e.id === entryId ? { ...e, eaten } : e))) });
  },

  removeEntry: async (entryId) => {
    await calendarRepo.delete(entryId);
    set({
      entriesByDate: mapEntries(get().entriesByDate, (es) =>
        es.filter((e) => e.id !== entryId && e.sourceEntryId !== entryId)
      ),
    });
  },

  forgetMeal: (mealId) => {
    set({ entriesByDate: mapEntries(get().entriesByDate, (es) => es.filter((e) => e.mealId !== mealId)) });
  },
}));
