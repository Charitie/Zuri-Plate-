import React, { useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { Meal, MealIngredient } from '@/data/types';
import { useMealsStore } from '@/store/useMealsStore';
import { findEntry, useCalendarStore } from '@/store/useCalendarStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { CalendarStackParamList, MealScreensParamList } from '@/app/navigationTypes';
import { reportError } from '@/services/errors';

type Props = NativeStackScreenProps<MealScreensParamList, 'MealDetail'>;

export function MealDetailScreen({ route, navigation }: Props) {
  const { mealId, entryId } = route.params;
  const removeMeal = useMealsStore((s) => s.removeMeal);
  const removeEntry = useCalendarStore((s) => s.removeEntry);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [notFound, setNotFound] = useState(false);

  // Reload on focus so edits made in MealEditor show up when navigating back.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [m, ings] = await Promise.all([mealsRepo.getById(mealId), mealsRepo.getIngredients(mealId)]);
          if (cancelled) return;
          setMeal(m);
          setNotFound(!m);
          setIngredients(ings);
        } catch (e) {
          if (!cancelled) reportError(e, "Couldn't load this meal.");
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [mealId])
  );

  const entry = useCalendarStore((s) => (entryId ? findEntry(s, entryId) : undefined));

  // Opened from a day whose entry has since been replaced (via "Change meal")
  // or removed: this screen is stale, so step back to the day.
  useFocusEffect(
    useCallback(() => {
      if (entryId && !findEntry(useCalendarStore.getState(), entryId)) navigation.goBack();
    }, [entryId, navigation])
  );

  const changeMeal = () => {
    if (!entry) return;
    // entryId is only passed from the Calendar stack, where AddMealToDay exists.
    const calendarNav = navigation as unknown as NativeStackNavigationProp<CalendarStackParamList>;
    calendarNav.navigate('AddMealToDay', { date: entry.date, slot: entry.slot });
  };

  const confirmRemoveFromDay = () => {
    if (!meal || !entryId) return;
    const all = Object.values(useCalendarStore.getState().entriesByDate).flat();
    const hasLeftover = all.some((e) => e.sourceEntryId === entryId);
    Alert.alert(
      'Remove from this day?',
      hasLeftover
        ? `"${meal.name}" and the leftover lunch made from it will be removed from your calendar.`
        : `"${meal.name}" will be removed from this day. It stays in your meal library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeEntry(entryId);
              navigation.goBack();
            } catch (e) {
              reportError(e, "Couldn't remove this meal from the day.");
            }
          },
        },
      ]
    );
  };

  const confirmDelete = () => {
    if (!meal) return;
    Alert.alert('Delete meal?', `"${meal.name}" will also be removed from your calendar.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMeal(meal.id);
            navigation.goBack();
          } catch (e) {
            reportError(e, "Couldn't delete this meal.");
          }
        },
      },
    ]);
  };

  if (notFound) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={typography.body}>This meal no longer exists.</Text>
      </View>
    );
  }
  if (!meal) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      {meal.photoUri && (
        <Image source={{ uri: meal.photoUri }} style={styles.photo} accessibilityLabel={`Photo of ${meal.name}`} />
      )}
      <Text style={typography.h1} accessibilityRole="header">
        {meal.name}
      </Text>
      <Text style={{ color: colors.textMuted }}>
        {meal.type} · {meal.proteinG}g protein · {meal.servings} serving{meal.servings > 1 ? 's' : ''}
      </Text>

      <View>
        <Text style={typography.bodyBold} accessibilityRole="header">
          Ingredients
        </Text>
        {ingredients.map((ing) => (
          <Text key={ing.id} style={{ color: colors.text, marginTop: 4 }}>
            • {ing.name} — {ing.quantity} {ing.unit}
          </Text>
        ))}
      </View>

      {entry && (
        <>
          <PrimaryButton
            title="Change meal"
            onPress={changeMeal}
            accessibilityHint={`Pick a different ${entry.slot} for this day`}
          />
          <PrimaryButton title="Remove from this day" variant="secondary" onPress={confirmRemoveFromDay} />
        </>
      )}
      <PrimaryButton title="Edit meal" variant="secondary" onPress={() => navigation.navigate('MealEditor', { mealId: meal.id })} />
      <PrimaryButton title="Delete meal" variant="secondary" onPress={confirmDelete} style={styles.delete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  photo: { width: '100%', height: 200, borderRadius: 14 },
  delete: { borderWidth: 1, borderColor: colors.danger },
});
