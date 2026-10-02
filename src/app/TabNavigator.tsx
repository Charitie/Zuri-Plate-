import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { CalendarScreen } from '@/screens/calendar/CalendarScreen';
import { DayDetailScreen } from '@/screens/calendar/DayDetailScreen';
import { PlanWizardScreen } from '@/screens/calendar/PlanWizardScreen';
import { AddMealToDayScreen } from '@/screens/calendar/AddMealToDayScreen';
import { MealLibraryScreen } from '@/screens/meals/MealLibraryScreen';
import { MealDetailScreen } from '@/screens/meals/MealDetailScreen';
import { MealEditorScreen } from '@/screens/meals/MealEditorScreen';
import { ShoppingListScreen } from '@/screens/shopping/ShoppingListScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { colors } from '@/theme/colors';
import { CalendarStackParamList, MealsStackParamList, TabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<TabParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const MealsStack = createNativeStackNavigator<MealsStackParamList>();

function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="CalendarHome" component={CalendarScreen} />
      <CalendarStack.Screen name="DayDetail" component={DayDetailScreen} options={{ headerShown: true }} />
      <CalendarStack.Screen
        name="AddMealToDay"
        component={AddMealToDayScreen}
        options={{ headerShown: true, title: 'Add meal', presentation: 'modal' }}
      />
      <CalendarStack.Screen name="PlanWizard" component={PlanWizardScreen} options={{ headerShown: true, presentation: 'modal' }} />
      <CalendarStack.Screen name="MealDetail" component={MealDetailScreen} options={{ headerShown: true }} />
      <CalendarStack.Screen name="MealEditor" component={MealEditorScreen} options={{ headerShown: true }} />
    </CalendarStack.Navigator>
  );
}

function MealsStackScreen() {
  return (
    <MealsStack.Navigator screenOptions={{ headerShown: false }}>
      <MealsStack.Screen name="MealLibraryHome" component={MealLibraryScreen} />
      <MealsStack.Screen name="MealDetail" component={MealDetailScreen} options={{ headerShown: true }} />
      <MealsStack.Screen name="MealEditor" component={MealEditorScreen} options={{ headerShown: true }} />
    </MealsStack.Navigator>
  );
}

const ICONS: Record<keyof TabParamList, string> = {
  Calendar: '📅',
  Meals: '🍽️',
  Shopping: '🛒',
  Settings: '⚙️',
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        // Emoji icons are decorative; the tab label is what screen readers announce.
        tabBarIcon: () => <Text importantForAccessibility="no" accessibilityElementsHidden>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Calendar" component={CalendarStackScreen} />
      <Tab.Screen name="Meals" component={MealsStackScreen} />
      <Tab.Screen name="Shopping" component={ShoppingListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
