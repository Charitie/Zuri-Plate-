import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useCalendarStore } from '@/store/useCalendarStore';
import { MealCard } from '@/components/MealCard';
import { ProteinProgressBar } from '@/components/ProteinProgressBar';
import { dailyProteinTotal } from '@/domain/proteinCalculator';
import { useSettingsStore } from '@/store/useSettingsStore';

export function DayDetailScreen({ route, navigation }: any) {
  const { date } = route.params;
  const entries = useCalendarStore((s) => s.entriesByDate[date] ?? []);
  const removeEntry = useCalendarStore((s) => s.removeEntry);
  const target = useSettingsStore((s) => s.settings?.proteinTargetG ?? 120);

  const totalG = dailyProteinTotal(entries);

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>{date}</Text>
      <ProteinProgressBar totalG={totalG} targetG={target} />
      <ScrollView contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 24 }}>
        {entries.map((entry) => (
          <MealCard
            key={entry.id}
            entry={entry}
            onPress={() => navigation.navigate('MealDetail', { mealId: entry.meal.id, entryId: entry.id })}
          />
        ))}
        {entries.length === 0 && <Text style={{ color: colors.textMuted }}>Nothing planned. Add a meal from the library.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, backgroundColor: colors.background },
});
