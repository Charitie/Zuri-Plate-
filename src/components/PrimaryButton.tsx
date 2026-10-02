import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'large' | 'small';
  /** Shows a spinner and blocks presses — prevents double-submits. */
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  accessibilityHint,
  style,
}: Props) {
  const inactive = disabled || loading;
  const secondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'small' && styles.small,
        secondary && styles.secondary,
        (pressed || inactive) && styles.dimmed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.primary : 'white'} />
      ) : (
        <Text style={[styles.text, size === 'small' && styles.textSmall, secondary && styles.secondaryText]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', minHeight: 48 },
  small: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, minHeight: 0 },
  secondary: { backgroundColor: colors.surface },
  dimmed: { opacity: 0.6 },
  text: { color: 'white', fontWeight: '700', fontSize: 16 },
  textSmall: { fontSize: 14 },
  secondaryText: { color: colors.text },
});
