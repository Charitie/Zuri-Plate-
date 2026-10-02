import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { CalendarStackParamList } from '@/app/navigationTypes';
import { generateAndSavePlan, EmptyMealLibraryError } from '@/services/planService';
import { reportError } from '@/services/errors';
import { useToday } from '@/hooks/useToday';

type Props = NativeStackScreenProps<CalendarStackParamList, 'PlanWizard'>;

export function PlanWizardScreen({ navigation }: Props) {
  const settings = useSettingsStore((s) => s.settings);
  const loadRange = useCalendarStore((s) => s.loadRange);
  const today = useToday();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!settings || generating) return;
    setGenerating(true);
    try {
      const { startDate, endDate } = await generateAndSavePlan(settings, today);
      // The leftover lunch after the last day may have been removed with its dinner.
      await loadRange(startDate, endDate);
      navigation.goBack();
    } catch (e) {
      reportError(e, e instanceof EmptyMealLibraryError ? e.message : "Couldn't create your plan. Nothing was changed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2} accessibilityRole="header">
        Plan my week
      </Text>
      {settings && (
        <Text style={{ color: colors.textMuted }}>
          {settings.planDays} days · target {settings.proteinTargetG}g protein/day ·{' '}
          {settings.leftoverLunchEnabled ? 'leftovers on for lunch' : 'lunch planned separately'}
        </Text>
      )}
      <Text style={{ color: colors.textMuted }}>This replaces anything already planned for these days.</Text>

      <PrimaryButton
        title="Generate Plan"
        onPress={handleGenerate}
        loading={generating}
        disabled={!settings}
        accessibilityHint="Creates a meal plan starting today"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 20, justifyContent: 'center', backgroundColor: colors.background },
});
