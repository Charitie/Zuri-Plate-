import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export function ProteinTargetScreen({ navigation }: any) {
  const [target, setTarget] = useState('120');

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>Daily protein target</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={target}
        onChangeText={setTarget}
        placeholder="120"
      />
      <Text style={{ textAlign: 'center', color: colors.textMuted }}>grams / day</Text>
      <Pressable
        style={styles.cta}
        onPress={() => navigation.navigate('LeftoverPref', { proteinTargetG: Number(target) || 120 })}
      >
        <Text style={styles.ctaText}>Next</Text>
      </Pressable>
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
  cta: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
