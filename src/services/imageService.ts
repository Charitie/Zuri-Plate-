import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { photosDir } from './photoPaths';

const MAX_DIMENSION = 800;

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(photosDir());
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(photosDir(), { intermediates: true });
  }
}

/** Launches the camera, compresses the result, and returns a local file path (or null if cancelled). */
export async function captureMealPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false });
  if (result.canceled || !result.assets?.[0]) return null;

  return compressAndStore(result.assets[0].uri);
}

/** Same as captureMealPhoto but from the photo library. */
export async function pickMealPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
  if (result.canceled || !result.assets?.[0]) return null;

  return compressAndStore(result.assets[0].uri);
}

async function compressAndStore(sourceUri: string): Promise<string> {
  await ensurePhotosDir();

  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const destUri = `${photosDir()}${Crypto.randomUUID()}.jpg`;
  await FileSystem.copyAsync({ from: manipulated.uri, to: destUri });
  return destUri;
}

/** Only deletes files inside our own photos dir — never a user's library asset. */
export async function deleteMealPhoto(uri: string | null): Promise<void> {
  if (!uri || !uri.startsWith(photosDir())) return;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
}
