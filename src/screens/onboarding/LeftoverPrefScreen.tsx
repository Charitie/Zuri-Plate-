import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export function LeftoverPrefScreen({ navigation, route }: any) {
  const { proteinTargetG } = route.params;

  const choose = (leftoverLunchEnabled: boolean) =>
    navigation.navigate('PlanDays', { proteinTargetG, leftoverLunchEnabled });

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>Prefer leftovers for lunch?</Text>
      <Pressable style={styles.cta} onPress={() => choose(true)}>
        <Text style={styles.ctaText}>Yes</Text>
      </Pressable>
      <Pressable style={[styles.cta, styles.secondary]} onPress={() => choose(false)}>
        <Text style={[styles.ctaText, styles.secondaryText]}>No, plan lunch separately</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, justifyContent: 'center', backgroundColor: colors.background },
  cta: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 16 },
  secondary: { backgroundColor: colors.surface },
  secondaryText: { color: colors.text },
});
