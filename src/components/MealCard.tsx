import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { CalendarEntryWithMeal, MealType } from '@/data/types';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { entryProtein } from '@/domain/proteinCalculator';

interface Props {
  entry: CalendarEntryWithMeal;
  onPress?: () => void;
}

const SLOT_ICON: Record<MealType, string> = {
  breakfast: '🍳',
  lunch: '🍗',
  dinner: '🍲',
  snack: '🥣',
};

export function MealCard({ entry, onPress }: Props) {
  const protein = Math.round(entryProtein(entry));

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.card}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${entry.slot}: ${entry.meal.name}${entry.isLeftover ? ', leftover' : ''}, ${protein} grams protein${entry.eaten ? ', eaten' : ''}`}
    >
      {entry.meal.photoUri ? (
        <Image source={{ uri: entry.meal.photoUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={{ fontSize: 20 }}>{SLOT_ICON[entry.slot] ?? '🍽️'}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={typography.bodyBold}>
          {SLOT_ICON[entry.slot] ?? ''} {entry.meal.name}
        </Text>
        {entry.isLeftover && <Text style={styles.leftoverTag}>↳ Leftover</Text>}
        <Text style={styles.protein}>{protein} g protein</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  thumb: { width: 48, height: 48, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  leftoverTag: { ...typography.caption, color: colors.accent, marginTop: 2 },
  protein: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
