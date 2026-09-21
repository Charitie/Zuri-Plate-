import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useSettingsStore } from '@/store/useSettingsStore';

export function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const load = useSettingsStore((s) => s.load);
  const update = useSettingsStore((s) => s.update);
  const [targetDraft, setTargetDraft] = useState('');

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (settings) setTargetDraft(String(settings.proteinTargetG));
  }, [settings?.proteinTargetG]);

  if (!settings) return null;

  return (
    <View style={styles.container}>
      <Text style={typography.h1}>Settings</Text>

      <View style={styles.row}>
        <Text style={typography.body}>Daily protein target (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={targetDraft}
          onChangeText={setTargetDraft}
          onEndEditing={() => update({ proteinTargetG: Number(targetDraft) || settings.proteinTargetG })}
        />
      </View>

      <View style={styles.row}>
        <Text style={typography.body}>Leftovers for lunch</Text>
        <Switch
          value={settings.leftoverLunchEnabled}
          onValueChange={(v) => update({ leftoverLunchEnabled: v })}
        />
      </View>

      <View style={styles.row}>
        <Text style={typography.body}>Plan length (days)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(settings.planDays)}
          onChangeText={(v) => update({ planDays: Number(v) || settings.planDays })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 20, backgroundColor: colors.background },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, width: 80, textAlign: 'center' },
});
