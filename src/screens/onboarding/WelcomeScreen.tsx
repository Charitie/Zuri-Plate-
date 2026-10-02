import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OnboardingStackParamList } from '@/app/navigationTypes';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={typography.h1} accessibilityRole="header">
        Plan meals.{'\n'}Cook once.{'\n'}Eat better.
      </Text>
      <PrimaryButton title="Get started" onPress={() => navigation.navigate('ProteinTarget')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 32, backgroundColor: colors.background },
});
