import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { PrimaryButton } from './PrimaryButton';

interface State {
  error: Error | null;
}

/**
 * Last line of defence for render errors: shows a recovery screen instead of a
 * white screen / crash. (Event-handler and async errors don't reach here —
 * those go through reportError.)
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Hook for crash reporting (e.g. Sentry.captureException(error, { extra: info })).
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={typography.h2}>Something went wrong</Text>
        <Text style={{ color: colors.textMuted }}>Your meals and plans are saved on this device.</Text>
        <PrimaryButton title="Try again" onPress={() => this.setState({ error: null })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.background },
});
