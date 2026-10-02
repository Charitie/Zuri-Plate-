import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MealType } from '@/data/types';

/** Screens that exist in both the Calendar and Meals stacks. */
export type MealScreensParamList = {
  MealDetail: { mealId: string; entryId?: string };
  MealEditor: { mealId?: string } | undefined;
};

export type CalendarStackParamList = MealScreensParamList & {
  CalendarHome: undefined;
  DayDetail: { date: string };
  AddMealToDay: { date: string; slot?: MealType };
  PlanWizard: undefined;
};

export type MealsStackParamList = MealScreensParamList & {
  MealLibraryHome: undefined;
};

export type TabParamList = {
  Calendar: NavigatorScreenParams<CalendarStackParamList>;
  Meals: NavigatorScreenParams<MealsStackParamList>;
  Shopping: undefined;
  Settings: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  ProteinTarget: undefined;
  LeftoverPref: { proteinTargetG: number };
  PlanDays: { proteinTargetG: number; leftoverLunchEnabled: boolean };
};

export type RootStackParamList = OnboardingStackParamList & {
  MainTabs: NavigatorScreenParams<TabParamList>;
};

// Types `useNavigation()` app-wide without passing generics everywhere.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
