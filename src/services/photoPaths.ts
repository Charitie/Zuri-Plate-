import * as FileSystem from 'expo-file-system/legacy';

export const PHOTOS_SUBDIR = 'meal-photos/';

function documentsDir(): string {
  return FileSystem.documentDirectory ?? '';
}

export function photosDir(): string {
  return `${documentsDir()}${PHOTOS_SUBDIR}`;
}

/**
 * The absolute documents path changes between iOS installs and backup restores,
 * so the DB stores photos relative to it ("meal-photos/<uuid>.jpg").
 * Anything outside our photos dir (e.g. a remote URL) is stored unchanged.
 */
export function toStoredPhotoPath(uri: string | null): string | null {
  if (!uri) return null;
  const i = uri.indexOf(PHOTOS_SUBDIR);
  return i >= 0 ? uri.slice(i) : uri;
}

/** Inverse of toStoredPhotoPath: turns a stored path back into a usable file URI. */
export function resolvePhotoUri(stored: string | null): string | null {
  if (!stored) return null;
  return stored.startsWith(PHOTOS_SUBDIR) ? `${documentsDir()}${stored}` : stored;
}
