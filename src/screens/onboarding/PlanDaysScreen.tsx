import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OnboardingStackParamList } from '@/app/navigationTypes';
import { reportError } from '@/services/errors';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PlanDays'>;

const OPTIONS = [3, 5, 7];

export function PlanDaysScreen({ route }: Props) {
  const { proteinTargetG, leftoverLunchEnabled } = route.params;
  const [planDays, setPlanDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  // No navigation call: once the store marks onboarding complete,
  // RootNavigator swaps in the main tabs.
  const finish = async () => {
    setSaving(true);
    try {
      await completeOnboarding({ proteinTargetG, leftoverLunchEnabled, planDays, varietyPreference: 'balanced' });
    } catch (e) {
      reportError(e, "Couldn't save your preferences.");
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2} accessibilityRole="header">
        How many days do you usually plan?
      </Text>
      <View style={styles.options} accessibilityRole="radiogroup">
        {OPTIONS.map((n) => {
          const selected = planDays === n;
          return (
            <Pressable
              key={n}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setPlanDays(n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${n} days`}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{n} days</Text>
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton title="Finish setup" onPress={finish} loading={saving} />
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
});
