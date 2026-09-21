import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useSettingsStore } from '@/store/useSettingsStore';

const OPTIONS = [3, 5, 7];

export function PlanDaysScreen({ navigation, route }: any) {
  const { proteinTargetG, leftoverLunchEnabled } = route.params;
  const [planDays, setPlanDays] = useState(7);
  const update = useSettingsStore((s) => s.update);

  const finish = async () => {
    await update({ proteinTargetG, leftoverLunchEnabled, planDays, varietyPreference: 'balanced' });
    navigation.getParent()?.navigate('MainTabs');
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>How many days do you usually plan?</Text>
      <View style={styles.options}>
        {OPTIONS.map((n) => (
          <Pressable
            key={n}
            style={[styles.option, planDays === n && styles.optionSelected]}
            onPress={() => setPlanDays(n)}
          >
            <Text style={[styles.optionText, planDays === n && styles.optionTextSelected]}>{n} days</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.cta} onPress={finish}>
        <Text style={styles.ctaText}>Finish setup</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 24, justifyContent: 'center', backgroundColor: colors.background },
  options: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center' },
  optionSelected: { backgroundColor: colors.primary },
  optionText: { fontWeight: '600', color: colors.text },
  optionTextSelected: { color: 'white' },
  cta: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
