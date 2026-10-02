import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useSettingsStore } from '@/store/useSettingsStore';
import { UserSettings } from '@/data/types';
import { reportError } from '@/services/errors';

const MAX_PLAN_DAYS = 14;

export function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [targetDraft, setTargetDraft] = useState('');
  const [daysDraft, setDaysDraft] = useState('');

  // Settings are loaded once at startup by RootNavigator.
  useEffect(() => {
    if (settings) setTargetDraft(String(settings.proteinTargetG));
  }, [settings?.proteinTargetG]); // eslint-disable-line react-hooks/exhaustive-deps -- sync draft only when the saved value changes

  useEffect(() => {
    if (settings) setDaysDraft(String(settings.planDays));
  }, [settings?.planDays]); // eslint-disable-line react-hooks/exhaustive-deps -- same as above

  if (!settings) return null;

  const save = async (patch: Partial<UserSettings>) => {
    try {
      await update(patch);
    } catch (e) {
      reportError(e, "Couldn't save your settings.");
    }
  };

  // Commit numeric fields on blur (not every keystroke), and reset the draft if invalid.
  const commitTarget = () => {
    const n = Number(targetDraft);
    if (n > 0) save({ proteinTargetG: n });
    else setTargetDraft(String(settings.proteinTargetG));
  };

  const commitDays = () => {
    const n = Math.round(Number(daysDraft));
    if (n >= 1 && n <= MAX_PLAN_DAYS) save({ planDays: n });
    else setDaysDraft(String(settings.planDays));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={typography.h1} accessibilityRole="header">
        Settings
      </Text>

      <View style={styles.row}>
        <Text style={typography.body}>Daily protein target (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={targetDraft}
          onChangeText={setTargetDraft}
          onEndEditing={commitTarget}
          accessibilityLabel="Daily protein target in grams"
        />
      </View>

      <View style={styles.row}>
        <Text style={typography.body}>Leftovers for lunch</Text>
        <Switch
          value={settings.leftoverLunchEnabled}
          onValueChange={(v) => save({ leftoverLunchEnabled: v })}
          accessibilityLabel="Leftovers for lunch"
        />
      </View>

      <View style={styles.row}>
        <Text style={typography.body}>Plan length (days)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={daysDraft}
          onChangeText={setDaysDraft}
          onEndEditing={commitDays}
          accessibilityLabel={`Plan length in days, 1 to ${MAX_PLAN_DAYS}`}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 20, backgroundColor: colors.background },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, width: 80, textAlign: 'center' },
});
