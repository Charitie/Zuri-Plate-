import { useMemo } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { dailyProteinTotal } from '@/domain/proteinCalculator';
import { todayIso } from '@/services/dateService';

export function useProteinToday() {
  const entries = useCalendarStore((s) => s.entriesByDate[todayIso()] ?? []);
  const target = useSettingsStore((s) => s.settings?.proteinTargetG ?? 120);

  return useMemo(() => {
    const totalG = dailyProteinTotal(entries);
    return { totalG, targetG: target, progress: target > 0 ? Math.min(totalG / target, 1) : 0 };
  }, [entries, target]);
}
