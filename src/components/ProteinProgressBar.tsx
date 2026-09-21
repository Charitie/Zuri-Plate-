import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Props {
  totalG: number;
  targetG: number;
}

export function ProteinProgressBar({ totalG, targetG }: Props) {
  const progress = targetG > 0 ? Math.min(totalG / targetG, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.label}>
        Protein today: {Math.round(totalG)} g / {Math.round(targetG)} g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },
  label: { ...typography.caption, color: colors.textMuted },
});
