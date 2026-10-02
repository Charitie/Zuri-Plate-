import { create } from 'zustand';
import { UserSettings } from '@/data/types';
import { settingsRepo } from '@/data/repositories/settingsRepo';
import { errorMessage } from '@/services/errors';

interface SettingsState {
  settings: UserSettings | null;
  /** null until load() has run — lets the root navigator wait instead of guessing. */
  onboarded: boolean | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  update: (patch: Partial<UserSettings>) => Promise<void>;
  completeOnboarding: (settings: UserSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  onboarded: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const [settings, onboarded] = await Promise.all([settingsRepo.get(), settingsRepo.hasCompletedOnboarding()]);
      set({ settings, onboarded });
    } catch (e) {
      set({ error: errorMessage(e) });
    } finally {
      set({ loading: false });
    }
  },

  update: async (patch) => {
    const current = get().settings ?? (await settingsRepo.get());
    const next = { ...current, ...patch };
    await settingsRepo.save(next);
    set({ settings: next });
  },

  completeOnboarding: async (settings) => {
    await settingsRepo.completeOnboarding(settings);
    set({ settings, onboarded: true });
  },
}));
