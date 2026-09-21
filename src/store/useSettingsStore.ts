import { create } from 'zustand';
import { UserSettings } from '@/data/types';
import { settingsRepo } from '@/data/repositories/settingsRepo';

interface SettingsState {
  settings: UserSettings | null;
  loading: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,

  load: async () => {
    set({ loading: true });
    const settings = await settingsRepo.get();
    set({ settings, loading: false });
  },

  update: async (patch) => {
    const current = get().settings ?? (await settingsRepo.get());
    const next = { ...current, ...patch };
    await settingsRepo.save(next);
    set({ settings: next });
  },
}));
