import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { EMPTY_ENTRIES, useCalendarStore } from '@/store/useCalendarStore';
import { MealCard } from '@/components/MealCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProteinProgressBar } from '@/components/ProteinProgressBar';
import { dailyProteinTotal } from '@/domain/proteinCalculator';
import { useSettingsStore } from '@/store/useSettingsStore';
import { DEFAULT_SETTINGS } from '@/data/repositories/settingsRepo';
import { formatLongDate } from '@/services/dateService';
import { CalendarStackParamList } from '@/app/navigationTypes';

type Props = NativeStackScreenProps<CalendarStackParamList, 'DayDetail'>;

export function DayDetailScreen({ route, navigation }: Props) {
  const { date } = route.params;
  const entries = useCalendarStore((s) => s.entriesByDate[date] ?? EMPTY_ENTRIES);
  const target = useSettingsStore((s) => s.settings?.proteinTargetG ?? DEFAULT_SETTINGS.proteinTargetG);

  const totalG = dailyProteinTotal(entries);

  return (
    <View style={styles.container}>
      <Text style={typography.h2} accessibilityRole="header">
        {formatLongDate(date)}
      </Text>
      <ProteinProgressBar totalG={totalG} targetG={target} />
      <ScrollView contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 24 }}>
        {entries.map((entry) => (
          <MealCard
            key={entry.id}
            entry={entry}
            onPress={() => navigation.navigate('MealDetail', { mealId: entry.meal.id, entryId: entry.id })}
          />
        ))}
        {entries.length === 0 && <Text style={{ color: colors.textMuted }}>Nothing planned yet.</Text>}
        <PrimaryButton
          title="+ Add meal"
          variant="secondary"
          onPress={() => navigation.navigate('AddMealToDay', { date })}
          accessibilityHint={`Adds a meal to ${formatLongDate(date)}`}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, backgroundColor: colors.background },
});
