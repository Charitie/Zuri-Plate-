import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={typography.h1}>Plan meals.{'\n'}Cook once.{'\n'}Eat better.</Text>
      <Pressable style={styles.cta} onPress={() => navigation.navigate('ProteinTarget')}>
        <Text style={styles.ctaText}>Get started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 32, backgroundColor: colors.background },
  cta: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
