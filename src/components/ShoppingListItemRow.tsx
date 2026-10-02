import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { ShoppingListItem } from '@/data/types';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Props {
  item: ShoppingListItem;
  onToggle: (checked: boolean) => void;
}

export function ShoppingListItemRow({ item, onToggle }: Props) {
  const quantity = item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1);
  return (
    <Pressable
      style={styles.row}
      onPress={() => onToggle(!item.checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.checked }}
      accessibilityLabel={`${item.name}, ${quantity} ${item.unit}`}
    >
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[typography.body, item.checked && styles.checkedText]}>
        {item.name} — {quantity} {item.unit}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: 'white', fontSize: 12, fontWeight: '700' },
  checkedText: { textDecorationLine: 'line-through', color: colors.textMuted },
});
