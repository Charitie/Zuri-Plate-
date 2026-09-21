import { create } from 'zustand';
import { CalendarEntryWithMeal } from '@/data/types';
import { calendarRepo } from '@/data/repositories/calendarRepo';

interface CalendarState {
  entriesByDate: Record<string, CalendarEntryWithMeal[]>;
  loading: boolean;
  loadRange: (startDate: string, endDate: string) => Promise<void>;
  markEaten: (entryId: string, eaten: boolean) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
}

function groupByDate(entries: CalendarEntryWithMeal[]): Record<string, CalendarEntryWithMeal[]> {
  return entries.reduce<Record<string, CalendarEntryWithMeal[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  entriesByDate: {},
  loading: false,

  loadRange: async (startDate, endDate) => {
    set({ loading: true });
    const entries = await calendarRepo.listByDateRange(startDate, endDate);
    set({ entriesByDate: { ...get().entriesByDate, ...groupByDate(entries) }, loading: false });
  },

  markEaten: async (entryId, eaten) => {
    await calendarRepo.update(entryId, { eaten });
    const next = { ...get().entriesByDate };
    for (const date of Object.keys(next)) {
      next[date] = next[date].map((e) => (e.id === entryId ? { ...e, eaten } : e));
    }
    set({ entriesByDate: next });
  },

  removeEntry: async (entryId) => {
    await calendarRepo.delete(entryId);
    const next = { ...get().entriesByDate };
    for (const date of Object.keys(next)) {
      next[date] = next[date].filter((e) => e.id !== entryId && e.sourceEntryId !== entryId);
    }
    set({ entriesByDate: next });
  },
}));
