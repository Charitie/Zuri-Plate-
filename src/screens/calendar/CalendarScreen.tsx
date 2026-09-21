import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useCalendarStore } from '@/store/useCalendarStore';
import { ProteinProgressBar } from '@/components/ProteinProgressBar';
import { MealCard } from '@/components/MealCard';
import { useProteinToday } from '@/hooks/useProteinToday';
import { todayIso, addDaysIso, dateRange } from '@/services/dateService';

export function CalendarScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const loadRange = useCalendarStore((s) => s.loadRange);
  const entriesByDate = useCalendarStore((s) => s.entriesByDate);
  const { totalG, targetG } = useProteinToday();

  useEffect(() => {
    const start = addDaysIso(todayIso(), -3);
    const end = addDaysIso(todayIso(), 10);
    loadRange(start, end);
  }, []);

  const visibleDates = dateRange(addDaysIso(todayIso(), -3), 14);
  const isToday = selectedDate === todayIso();
  const entries = entriesByDate[selectedDate] ?? [];
  const hasAnyEntries = Object.keys(entriesByDate).length > 0;

  return (
    <View style={styles.container}>
      <Text style={typography.h1}>{isToday ? 'Good morning 👋' : selectedDate}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
        {visibleDates.map((date) => (
          <Pressable
            key={date}
            onPress={() => setSelectedDate(date)}
            style={[styles.dateChip, date === selectedDate && styles.dateChipSelected]}
          >
            <Text style={[styles.dateChipText, date === selectedDate && styles.dateChipTextSelected]}>
              {date.slice(5)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isToday && <ProteinProgressBar totalG={totalG} targetG={targetG} />}

      {!hasAnyEntries ? (
        <View style={styles.empty}>
          <Text style={typography.body}>No plan yet for this week.</Text>
          <Pressable style={styles.cta} onPress={() => navigation.navigate('PlanWizard')}>
            <Text style={styles.ctaText}>Plan my week</Text>
          </Pressable>
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
        </ScrollView>
      )}
    </View>
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
  cta: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', paddingHorizontal: 28 },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
