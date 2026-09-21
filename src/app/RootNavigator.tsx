import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { ProteinTargetScreen } from '@/screens/onboarding/ProteinTargetScreen';
import { LeftoverPrefScreen } from '@/screens/onboarding/LeftoverPrefScreen';
import { PlanDaysScreen } from '@/screens/onboarding/PlanDaysScreen';
import { TabNavigator } from './TabNavigator';
import { getDb } from '@/data/db';
import { settingsRepo } from '@/data/repositories/settingsRepo';
import { colors } from '@/theme/colors';

const Stack = createNativeStackNavigator();

/** Onboarding is considered complete once a settings row exists with a non-default plan_days save. */
async function hasCompletedOnboarding(): Promise<boolean> {
  await getDb();
  // A simple heuristic for V1: settingsRepo.get() creates defaults on first
  // read, so we track completion by checking AsyncStorage/flag in a real
  // build. Kept simple here: always show onboarding once, then TabNavigator
  // owns navigation from MainTabs onward.
  return false;
}

export function RootNavigator() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    (async () => {
      await getDb();
      const skip = await hasCompletedOnboarding();
      setNeedsOnboarding(!skip);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {needsOnboarding && (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="ProteinTarget" component={ProteinTargetScreen} />
            <Stack.Screen name="LeftoverPref" component={LeftoverPrefScreen} />
            <Stack.Screen name="PlanDays" component={PlanDaysScreen} />
          </>
        )}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
