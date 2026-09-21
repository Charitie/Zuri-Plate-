import React from 'react';
import { View, Image, Pressable, Text, StyleSheet } from 'react-native';
import { captureMealPhoto, pickMealPhoto } from '@/services/imageService';
import { colors } from '@/theme/colors';

interface Props {
  photoUri: string | null;
  onChange: (uri: string | null) => void;
}

export function PhotoPicker({ photoUri, onChange }: Props) {
  const handleCapture = async () => {
    const uri = await captureMealPhoto();
    if (uri) onChange(uri);
  };

  const handlePick = async () => {
    const uri = await pickMealPhoto();
    if (uri) onChange(uri);
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : (
        <View style={[styles.preview, styles.placeholder]}>
          <Text style={{ color: colors.textMuted }}>No photo</Text>
        </View>
      )}
      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={handleCapture}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handlePick}>
          <Text style={styles.buttonText}>Choose from Library</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  preview: { width: '100%', height: 160, borderRadius: 12 },
  placeholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: colors.primaryMuted, alignItems: 'center' },
  buttonText: { color: colors.primary, fontWeight: '600' },
});
