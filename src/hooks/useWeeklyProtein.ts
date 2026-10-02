import { useMemo } from 'react';
import { EMPTY_ENTRIES, useCalendarStore } from '@/store/useCalendarStore';
import { weeklyProteinSummary } from '@/domain/proteinCalculator';

export function useWeeklyProtein(dates: string[]) {
  const entriesByDate = useCalendarStore((s) => s.entriesByDate);

  return useMemo(() => {
    const scoped = Object.fromEntries(dates.map((d) => [d, entriesByDate[d] ?? EMPTY_ENTRIES]));
    return weeklyProteinSummary(scoped);
  }, [entriesByDate, dates]);
}
