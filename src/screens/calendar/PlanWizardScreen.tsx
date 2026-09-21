import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useSettingsStore } from '@/store/useSettingsStore';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { calendarRepo } from '@/data/repositories/calendarRepo';
import { generateWeeklyPlan } from '@/domain/planGenerator';
import { MealType, CalendarEntry } from '@/data/types';
import { todayIso } from '@/services/dateService';
import { useCalendarStore } from '@/store/useCalendarStore';

/**
 * Generates a plan and persists it day-by-day so leftover lunches can be
 * linked to a real, already-inserted dinner entry id (planGenerator.ts
 * produces placeholder entries; this screen is where they become real rows).
 */
export function PlanWizardScreen({ navigation }: any) {
  const settings = useSettingsStore((s) => s.settings);
  const loadRange = useCalendarStore((s) => s.loadRange);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!settings) return;
    setGenerating(true);

    const types: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealsByType = Object.fromEntries(
      await Promise.all(types.map(async (t) => [t, await mealsRepo.listByType(t)]))
    ) as Record<MealType, Awaited<ReturnType<typeof mealsRepo.listByType>>>;

    const startDate = todayIso();
    const plan = generateWeeklyPlan({ startDate, settings, mealsByType });

    // Insert day by day, non-leftover entries first, then patch lunch's
    // leftover link once the real dinner id exists.
    let lastDinnerId: string | null = null;
    const grouped = groupByDate(plan);

    for (const date of Object.keys(grouped).sort()) {
      for (const entry of grouped[date]) {
        if (entry.slot === 'lunch' && entry.isLeftover && lastDinnerId) {
          await calendarRepo.create({ ...entry, sourceEntryId: lastDinnerId });
          continue;
        }
        const inserted = await calendarRepo.create(entry);
        if (entry.slot === 'dinner') lastDinnerId = inserted.id;
      }
    }

    await loadRange(startDate, grouped[Object.keys(grouped).sort().slice(-1)[0]] ? Object.keys(grouped).sort().slice(-1)[0] : startDate);
    setGenerating(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>Plan my week</Text>
      <Text style={{ color: colors.textMuted }}>
        {settings?.planDays ?? 7} days · target {settings?.proteinTargetG ?? 120}g protein/day ·{' '}
        {settings?.leftoverLunchEnabled ? 'leftovers on for lunch' : 'lunch planned separately'}
      </Text>

      {generating ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Pressable style={styles.cta} onPress={handleGenerate}>
          <Text style={styles.ctaText}>Generate Plan</Text>
        </Pressable>
      )}
    </View>
  );
}

function groupByDate(entries: Omit<CalendarEntry, 'id'>[]): Record<string, Omit<CalendarEntry, 'id'>[]> {
  return entries.reduce<Record<string, Omit<CalendarEntry, 'id'>[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 20, justifyContent: 'center', backgroundColor: colors.background },
  cta: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
