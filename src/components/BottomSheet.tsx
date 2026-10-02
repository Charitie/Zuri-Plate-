import React from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Slide-up modal panel; tapping the dimmed backdrop (or Android back) closes it. */
export function BottomSheet({ visible, title, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={`Close ${title.toLowerCase()}`} />
      <View style={styles.sheet}>
        <Text style={typography.bodyBold} accessibilityRole="header">
          {title}
        </Text>
        {children}
      </View>
    </Modal>
  );
}

/** Pill-shaped option, shared by the pickers that live in a BottomSheet. */
export function SheetChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export const sheetStyles = StyleSheet.create({
  groupTitle: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.background,
    padding: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 16,
  },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.text },
  chipTextSelected: { color: 'white' },
});
