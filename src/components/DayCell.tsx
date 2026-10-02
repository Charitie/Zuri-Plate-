import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  dateLabel: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  proteinFraction: number; // 0..1, drives a small indicator dot's opacity
  onPress: () => void;
}

export function DayCell({ dateLabel, dayNumber, isToday, isSelected, proteinFraction, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.cell, isSelected && styles.selected, isToday && styles.today]}
      accessibilityRole="button"
      accessibilityLabel={`${isToday ? 'Today, ' : ''}${dateLabel} ${dayNumber}, ${Math.round(proteinFraction * 100)}% of protein target`}
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={styles.dayLabel}>{dateLabel}</Text>
      <Text style={styles.dayNumber}>{dayNumber}</Text>
      <Text style={[styles.dot, { opacity: proteinFraction }]}>●</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', padding: 8, borderRadius: 10, gap: 2, minWidth: 44 },
  selected: { backgroundColor: colors.primaryMuted },
  today: { borderWidth: 1, borderColor: colors.primary },
  dayLabel: { fontSize: 11, color: colors.textMuted },
  dayNumber: { fontSize: 16, fontWeight: '600', color: colors.text },
  dot: { fontSize: 8, color: colors.primary },
});
