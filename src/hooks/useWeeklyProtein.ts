import { useMemo } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';
import { weeklyProteinSummary } from '@/domain/proteinCalculator';

export function useWeeklyProtein(dates: string[]) {
  const entriesByDate = useCalendarStore((s) => s.entriesByDate);

  return useMemo(() => {
    const scoped = Object.fromEntries(dates.map((d) => [d, entriesByDate[d] ?? []]));
    return weeklyProteinSummary(scoped);
  }, [entriesByDate, dates]);
}
