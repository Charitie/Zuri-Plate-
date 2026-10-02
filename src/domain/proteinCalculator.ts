import { CalendarEntryWithMeal } from '@/data/types';

/** Protein contributed by one entry, scaled by servings actually consumed vs the meal's base servings. */
export function entryProtein(entry: CalendarEntryWithMeal): number {
  if (entry.meal.servings <= 0) return 0;
  const perServing = entry.meal.proteinG / entry.meal.servings;
  return perServing * entry.servingsUsed;
}

export function dailyProteinTotal(entries: readonly CalendarEntryWithMeal[]): number {
  return entries.reduce((sum, e) => sum + entryProtein(e), 0);
}

export interface WeeklyProteinSummary {
  date: string;
  totalG: number;
}

export function weeklyProteinSummary(
  entriesByDate: Record<string, readonly CalendarEntryWithMeal[]>
): WeeklyProteinSummary[] {
  return Object.entries(entriesByDate)
    .map(([date, entries]) => ({ date, totalG: dailyProteinTotal(entries) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
