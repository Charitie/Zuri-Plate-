import { Alert } from 'react-native';

/** Human-readable message for anything thrown. */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Single place every caught error goes. Logs it (swap in Sentry.captureException
 * here when crash reporting is added) and tells the user what failed.
 */
export function reportError(e: unknown, userMessage = 'Something went wrong. Please try again.'): void {
  console.error(e);
  Alert.alert('Error', userMessage);
}
