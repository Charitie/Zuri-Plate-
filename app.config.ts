import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Meal Calendar',
  slug: 'meal-calendar-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // No dark theme yet — force light so Android draws dark system-bar buttons on our white UI.
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: { supportsTablet: true, bundleIdentifier: 'com.mealcalendar.app' },
  android: {
    package: 'com.mealcalendar.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
