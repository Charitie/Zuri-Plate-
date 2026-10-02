import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { EMPTY_ENTRIES, useCalendarStore } from '@/store/useCalendarStore';
import { ProteinProgressBar } from '@/components/ProteinProgressBar';
import { MealCard } from '@/components/MealCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useProteinToday } from '@/hooks/useProteinToday';
import { useToday } from '@/hooks/useToday';
import { addDaysIso, dateRange, formatLongDate } from '@/services/dateService';
import { CalendarStackParamList } from '@/app/navigationTypes';

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarHome'>;

const DAYS_BEFORE = 3;
const DAYS_VISIBLE = 14;

export function CalendarScreen({ navigation }: Props) {
  const today = useToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const loadRange = useCalendarStore((s) => s.loadRange);
  const entries = useCalendarStore((s) => s.entriesByDate[selectedDate] ?? EMPTY_ENTRIES);
  const hasAnyEntries = useCalendarStore((s) => Object.values(s.entriesByDate).some((es) => es.length > 0));
  const error = useCalendarStore((s) => s.error);
  const { totalG, targetG } = useProteinToday();

  const visibleDates = useMemo(() => dateRange(addDaysIso(today, -DAYS_BEFORE), DAYS_VISIBLE), [today]);

  // Re-runs when the day rolls over, so the window follows "today".
  useEffect(() => {
    loadRange(visibleDates[0], visibleDates[visibleDates.length - 1]);
  }, [loadRange, visibleDates]);

  const isToday = selectedDate === today;
  const addMeal = () => navigation.navigate('AddMealToDay', { date: selectedDate });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={typography.h1} accessibilityRole="header">
        {isToday ? 'Good morning 👋' : formatLongDate(selectedDate)}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
        {visibleDates.map((date) => {
          const selected = date === selectedDate;
          return (
            <Pressable
              key={date}
              onPress={() => setSelectedDate(date)}
              style={[styles.dateChip, selected && styles.dateChipSelected]}
              accessibilityRole="button"
              accessibilityLabel={date === today ? `Today, ${formatLongDate(date)}` : formatLongDate(date)}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.dateChipText, selected && styles.dateChipTextSelected]}>{date.slice(5)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isToday && <ProteinProgressBar totalG={totalG} targetG={targetG} />}

      {error && (
        <Text style={{ color: colors.danger }} accessibilityLiveRegion="polite">
          {"Couldn't load your plan."}
        </Text>
      )}

      {!hasAnyEntries ? (
        <View style={styles.empty}>
          <Text style={typography.body}>No plan yet for this week.</Text>
          <PrimaryButton title="Plan my week" onPress={() => navigation.navigate('PlanWizard')} />
          <PrimaryButton title="Add a single meal" variant="secondary" onPress={addMeal} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
          {entries.length === 0 && <Text style={{ color: colors.textMuted }}>Nothing planned for this day.</Text>}
          {entries.map((entry) => (
            <MealCard
              key={entry.id}
              entry={entry}
              onPress={() => navigation.navigate('DayDetail', { date: selectedDate })}
            />
          ))}
          <PrimaryButton
            title="+ Add meal"
            variant="secondary"
            onPress={addMeal}
            accessibilityHint={`Adds a meal to ${formatLongDate(selectedDate)}`}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16, backgroundColor: colors.background },
  strip: { flexGrow: 0 },
  dateChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surface, marginRight: 8 },
  dateChipSelected: { backgroundColor: colors.primary },
  dateChipText: { color: colors.text, fontWeight: '600' },
  dateChipTextSelected: { color: 'white' },
  empty: { alignItems: 'center', gap: 16, paddingTop: 40 },
});
