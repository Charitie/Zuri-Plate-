import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OnboardingStackParamList } from '@/app/navigationTypes';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'LeftoverPref'>;

export function LeftoverPrefScreen({ navigation, route }: Props) {
  const { proteinTargetG } = route.params;

  const choose = (leftoverLunchEnabled: boolean) =>
    navigation.navigate('PlanDays', { proteinTargetG, leftoverLunchEnabled });

  return (
    <View style={styles.container}>
      <Text style={typography.h2} accessibilityRole="header">
        Prefer leftovers for lunch?
      </Text>
      <PrimaryButton title="Yes" onPress={() => choose(true)} />
      <PrimaryButton title="No, plan lunch separately" variant="secondary" onPress={() => choose(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, justifyContent: 'center', backgroundColor: colors.background },
});
