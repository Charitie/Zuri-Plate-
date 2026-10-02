import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OnboardingStackParamList } from '@/app/navigationTypes';
import { DEFAULT_SETTINGS } from '@/data/repositories/settingsRepo';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProteinTarget'>;

export function ProteinTargetScreen({ navigation }: Props) {
  const [target, setTarget] = useState(String(DEFAULT_SETTINGS.proteinTargetG));

  return (
    <View style={styles.container}>
      <Text style={typography.h2} accessibilityRole="header">
        Daily protein target
      </Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={target}
        onChangeText={setTarget}
        placeholder={String(DEFAULT_SETTINGS.proteinTargetG)}
        accessibilityLabel="Daily protein target in grams"
      />
      <Text style={{ textAlign: 'center', color: colors.textMuted }}>grams / day</Text>
      <PrimaryButton
        title="Next"
        onPress={() =>
          navigation.navigate('LeftoverPref', { proteinTargetG: Number(target) || DEFAULT_SETTINGS.proteinTargetG })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 20, justifyContent: 'center', backgroundColor: colors.background },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 24,
    textAlign: 'center',
  },
});
