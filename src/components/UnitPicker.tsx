import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BottomSheet, SheetChip, sheetStyles } from '@/components/BottomSheet';

/** Common ingredient units, grouped for the picker. Stored as the plain string shown here. */
export const UNIT_GROUPS: { title: string; units: string[] }[] = [
  { title: 'Weight', units: ['g', 'kg', 'oz', 'lb'] },
  { title: 'Volume', units: ['ml', 'l', 'tsp', 'tbsp', 'cup'] },
  { title: 'Count', units: ['piece', 'slice', 'clove', 'bunch', 'can', 'pack', 'pinch'] },
];

const ALL_UNITS = UNIT_GROUPS.flatMap((g) => g.units);

interface Props {
  value: string;
  onChange: (unit: string) => void;
  accessibilityLabel: string;
  style?: React.ComponentProps<typeof View>['style'];
}

export function UnitPicker({ value, onChange, accessibilityLabel, style }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const openPicker = () => {
    // Pre-fill "Other" when the current value isn't one of the presets (e.g. legacy free-text units).
    setCustom(value && !ALL_UNITS.includes(value) ? value : '');
    setOpen(true);
  };

  const select = (unit: string) => {
    onChange(unit);
    setOpen(false);
  };

  const submitCustom = () => {
    const trimmed = custom.trim();
    if (trimmed) select(trimmed);
  };

  return (
    <>
      <Pressable
        style={[styles.field, style]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: value || 'not set' }}
        accessibilityHint="Opens a list of units"
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]} numberOfLines={1}>
          {value || 'unit'}
        </Text>
        <Text style={styles.chevron} importantForAccessibility="no">
          ▾
        </Text>
      </Pressable>

      <BottomSheet visible={open} title="Choose a unit" onClose={() => setOpen(false)}>
        {UNIT_GROUPS.map((group) => (
          <View key={group.title} style={{ gap: 8 }}>
            <Text style={sheetStyles.groupTitle}>{group.title}</Text>
            <View style={sheetStyles.chipRow} accessibilityRole="radiogroup" accessibilityLabel={group.title}>
              {group.units.map((unit) => (
                <SheetChip key={unit} label={unit} selected={unit === value} onPress={() => select(unit)} />
              ))}
            </View>
          </View>
        ))}
        <View style={{ gap: 8 }}>
          <Text style={sheetStyles.groupTitle}>Other</Text>
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              placeholder="e.g. handful"
              accessibilityLabel="Custom unit"
              value={custom}
              onChangeText={setCustom}
              onSubmitEditing={submitCustom}
              returnKeyType="done"
              autoCapitalize="none"
            />
            <PrimaryButton title="Use" size="small" onPress={submitCustom} disabled={!custom.trim()} />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  fieldText: { flex: 1, fontSize: 15, color: colors.text },
  placeholder: { color: colors.textMuted },
  chevron: { color: colors.textMuted, marginLeft: 4 },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15 },
});
