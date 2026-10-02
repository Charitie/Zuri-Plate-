import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useMealsStore } from '@/store/useMealsStore';
import { EMPTY_ENTRIES, useCalendarStore } from '@/store/useCalendarStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Meal, MealType } from '@/data/types';
import { CalendarStackParamList } from '@/app/navigationTypes';
import { addMealToSlot } from '@/services/planService';
import { formatLongDate } from '@/services/dateService';
import { reportError } from '@/services/errors';

type Props = NativeStackScreenProps<CalendarStackParamList, 'AddMealToDay'>;

const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function AddMealToDayScreen({ route, navigation }: Props) {
  const { date } = route.params;
  const meals = useMealsStore((s) => s.meals);
  const mealsLoading = useMealsStore((s) => s.loading);
  const loadMeals = useMealsStore((s) => s.loadAll);
  const dayEntries = useCalendarStore((s) => s.entriesByDate[date] ?? EMPTY_ENTRIES);
  const loadRange = useCalendarStore((s) => s.loadRange);
  const settings = useSettingsStore((s) => s.settings);

  // Default to the requested slot, else the first empty one of the day.
  const [slot, setSlot] = useState<MealType>(
    () => route.params.slot ?? SLOTS.find((s) => !dayEntries.some((e) => e.slot === s)) ?? 'dinner'
  );
  const [showAll, setShowAll] = useState(false);
  const [savingMealId, setSavingMealId] = useState<string | null>(null);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const current = dayEntries.find((e) => e.slot === slot);
  const visibleMeals = useMemo(() => (showAll ? meals : meals.filter((m) => m.type === slot)), [meals, slot, showAll]);

  const choose = async (meal: Meal) => {
    if (!settings || savingMealId) return;
    setSavingMealId(meal.id);
    try {
      const { endDate } = await addMealToSlot(settings, date, slot, meal);
      await loadRange(date, endDate);
      navigation.goBack();
    } catch (e) {
      reportError(e, "Couldn't add this meal. Nothing was changed.");
      setSavingMealId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
      <Text style={typography.h2} accessibilityRole="header">
        Add to {formatLongDate(date)}
      </Text>

      <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Meal slot">
        {SLOTS.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, slot === s && styles.chipSelected]}
            onPress={() => setSlot(s)}
            accessibilityRole="radio"
            accessibilityState={{ checked: slot === s }}
            accessibilityLabel={s}
          >
            <Text style={[styles.chipText, slot === s && styles.chipTextSelected]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {current && (
        <Text style={styles.note} accessibilityLiveRegion="polite">
          Replaces {current.meal.name}
          {current.isLeftover ? ' (leftover)' : ''}.
        </Text>
      )}
      {slot === 'dinner' && settings?.leftoverLunchEnabled && (
        <Text style={styles.note}>
          {"Recipes with more than 1 serving also fill tomorrow's lunch with leftovers, if it's free."}
        </Text>
      )}

      <View style={styles.listHeader}>
        <Text style={typography.bodyBold}>{showAll ? 'All meals' : `${slot[0].toUpperCase()}${slot.slice(1)} meals`}</Text>
        <Pressable onPress={() => setShowAll((v) => !v)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>{showAll ? `Only ${slot}` : 'Show all meals'}</Text>
        </Pressable>
      </View>

      {mealsLoading && meals.length === 0 && <ActivityIndicator color={colors.primary} accessibilityLabel="Loading meals" />}

      {visibleMeals.map((meal) => {
        const summary = `${meal.type} · ${meal.proteinG}g · ${meal.servings} serving${meal.servings > 1 ? 's' : ''}`;
        const saving = savingMealId === meal.id;
        return (
          <Pressable
            key={meal.id}
            style={({ pressed }) => [styles.row, (pressed || saving) && { opacity: 0.6 }]}
            onPress={() => choose(meal)}
            disabled={!!savingMealId}
            accessibilityRole="button"
            accessibilityLabel={`Add ${meal.name} as ${slot}, ${summary}`}
            accessibilityState={{ busy: saving, disabled: !!savingMealId }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={typography.bodyBold}>{meal.name}</Text>
              <Text style={{ color: colors.textMuted }}>{summary}</Text>
            </View>
            {saving ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.add}>＋</Text>}
          </Pressable>
        );
      })}

      {!mealsLoading && visibleMeals.length === 0 && (
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.textMuted }}>
            {meals.length === 0
              ? 'Your meal library is empty.'
              : `No ${slot} meals yet. Tap "Show all meals" to pick from the rest.`}
          </Text>
          <PrimaryButton title="Create a meal" variant="secondary" onPress={() => navigation.navigate('MealEditor')} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.text, textTransform: 'capitalize' },
  chipTextSelected: { color: 'white' },
  note: { color: colors.textMuted },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: colors.surface, gap: 12 },
  add: { color: colors.primary, fontSize: 22, fontWeight: '700' },
});
