import { useMemo } from 'react';
import { EMPTY_ENTRIES, useCalendarStore } from '@/store/useCalendarStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { DEFAULT_SETTINGS } from '@/data/repositories/settingsRepo';
import { dailyProteinTotal } from '@/domain/proteinCalculator';
import { useToday } from './useToday';

export function useProteinToday() {
  const today = useToday();
  const entries = useCalendarStore((s) => s.entriesByDate[today] ?? EMPTY_ENTRIES);
  const target = useSettingsStore((s) => s.settings?.proteinTargetG ?? DEFAULT_SETTINGS.proteinTargetG);

  return useMemo(() => {
    const totalG = dailyProteinTotal(entries);
    return { totalG, targetG: target, progress: target > 0 ? Math.min(totalG / target, 1) : 0 };
  }, [entries, target]);
}
