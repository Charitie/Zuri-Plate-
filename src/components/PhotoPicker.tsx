import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { captureMealPhoto, pickMealPhoto } from '@/services/imageService';
import { reportError } from '@/services/errors';
import { colors } from '@/theme/colors';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  photoUri: string | null;
  onChange: (uri: string | null) => void;
}

export function PhotoPicker({ photoUri, onChange }: Props) {
  const run = async (source: () => Promise<string | null>) => {
    try {
      const uri = await source();
      if (uri) onChange(uri);
    } catch (e) {
      reportError(e, "Couldn't get that photo.");
    }
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} accessibilityLabel="Meal photo" />
      ) : (
        <View style={[styles.preview, styles.placeholder]}>
          <Text style={{ color: colors.textMuted }}>No photo</Text>
        </View>
      )}
      <View style={styles.actions}>
        <PrimaryButton title="Take Photo" variant="secondary" size="small" style={styles.button} onPress={() => run(captureMealPhoto)} />
        <PrimaryButton title="Choose from Library" variant="secondary" size="small" style={styles.button} onPress={() => run(pickMealPhoto)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  preview: { width: '100%', height: 160, borderRadius: 12 },
  placeholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, backgroundColor: colors.primaryMuted },
});
