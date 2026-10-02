import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { ProteinTargetScreen } from '@/screens/onboarding/ProteinTargetScreen';
import { LeftoverPrefScreen } from '@/screens/onboarding/LeftoverPrefScreen';
import { PlanDaysScreen } from '@/screens/onboarding/PlanDaysScreen';
import { TabNavigator } from './TabNavigator';
import { RootStackParamList } from './navigationTypes';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Which screens exist depends on `onboarded` from the settings store. When
 * onboarding completes the store flips the flag and React Navigation swaps the
 * stack — no manual `navigation.reset` needed, and Back can't return to it.
 */
export function RootNavigator() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  const error = useSettingsStore((s) => s.error);
  const load = useSettingsStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  if (onboarded === null) {
    return (
      <View style={styles.center}>
        {error ? (
          <>
            <Text style={typography.body}>{"Couldn't open your data."}</Text>
            <PrimaryButton title="Try again" onPress={load} />
          </>
        ) : (
          <ActivityIndicator color={colors.primary} accessibilityLabel="Loading" />
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {onboarded ? (
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="ProteinTarget" component={ProteinTargetScreen} />
            <Stack.Screen name="LeftoverPref" component={LeftoverPrefScreen} />
            <Stack.Screen name="PlanDays" component={PlanDaysScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: colors.background },
});
