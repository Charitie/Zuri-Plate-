import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { ShoppingCategory } from '@/data/types';
import { CATEGORY_LABEL, SHOPPING_CATEGORIES } from '@/domain/shoppingCategories';
import { BottomSheet, SheetChip, sheetStyles } from '@/components/BottomSheet';

interface Props {
  /** The user's choice; null = auto (use `suggested`). */
  value: ShoppingCategory | null;
  /** What keyword matching would pick for the current ingredient name. */
  suggested: ShoppingCategory;
  onChange: (category: ShoppingCategory | null) => void;
  accessibilityLabel: string;
}

/**
 * Small chip showing an ingredient's shopping category. Defaults to the
 * keyword-based suggestion (shown as "auto"); tapping lets the user override it.
 */
export function CategoryPicker({ value, suggested, onChange, accessibilityLabel }: Props) {
  const [open, setOpen] = useState(false);
  const isAuto = value === null;
  const effective = value ?? suggested;

  const select = (category: ShoppingCategory | null) => {
    onChange(category);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={[styles.chip, isAuto && styles.chipAuto]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: `${CATEGORY_LABEL[effective]}${isAuto ? ', automatic' : ''}` }}
        accessibilityHint="Choose which shopping list section this goes in"
      >
        <Text style={[styles.chipText, isAuto && styles.chipTextAuto]} numberOfLines={1}>
          {CATEGORY_LABEL[effective]}
          {isAuto && <Text style={styles.autoTag}> · auto</Text>} ▾
        </Text>
      </Pressable>

      <BottomSheet visible={open} title="Shopping category" onClose={() => setOpen(false)}>
        <View style={sheetStyles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Shopping category">
          <SheetChip label={`Auto (${CATEGORY_LABEL[suggested]})`} selected={isAuto} onPress={() => select(null)} />
          {SHOPPING_CATEGORIES.map((c) => (
            <SheetChip key={c} label={CATEGORY_LABEL[c]} selected={value === c} onPress={() => select(c)} />
          ))}
        </View>
        <Text style={sheetStyles.groupTitle}>Auto picks a section from the ingredient name.</Text>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
  },
  chipAuto: { backgroundColor: colors.surface },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  chipTextAuto: { color: colors.textMuted },
  autoTag: { fontWeight: '400' },
});
