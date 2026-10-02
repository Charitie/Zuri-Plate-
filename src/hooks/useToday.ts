import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { msUntilNextDay, todayIso } from '@/services/dateService';

/**
 * Today's date (YYYY-MM-DD) that stays correct if the app is left open past
 * midnight or resumed from the background on a later day.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayIso);

  useEffect(() => {
    const refresh = () => setToday(todayIso());

    const timer = setTimeout(refresh, msUntilNextDay() + 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [today]); // re-arm the midnight timer each time the day changes

  return today;
}
